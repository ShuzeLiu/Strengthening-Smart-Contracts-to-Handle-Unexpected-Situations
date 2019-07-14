/**
 * 
 * @param {org.selection.v1.add} add 
 * @transaction
 */
async function addCourse(add) {   //add courses 

    if (add.course.capacity<=add.course.actualStudentNumber) {
      throw new Error("Course " + add.course.courseName + " is filled");
    }
    else {
      if (add.course.price>add.newStudent.studentYear){
      throw new Error("Course " + add.course.courseName + " is not in your timeslot");
      }
      
       else {
        var exist=0;
        for (let i=0; i<add.course.actualStudent.length; i++) {
          if (add.course.actualStudent[i].studentId==add.newStudent.studentId) exist=1;
        }
        if (!exist){
        	add.course.actualStudentNumber+=1;
        	add.course.actualStudent.push(add.newStudent)
        	const assetRegistry = await getAssetRegistry('org.selection.v1.Course');
        	await assetRegistry.update(add.course);
      
        	add.newStudent.registeredCredits+=add.course.credits;
        	add.newStudent.registeredCourse.push(add.course)
        	const ParticipantRegistry = await getParticipantRegistry('org.selection.v1.Student');
        	await ParticipantRegistry.update(add.newStudent);
       		}
            else {throw new Error("Student " + add.newStudent.studentId +" is already in course: "+add.course.courseName);}
        	}
       }
  
}

/**
 * 
 * @param {org.selection.v1.drop} drop 
 * @transaction
 */
async function dropCourse(drop) {     //drop course

    // set the new owner of the commodity
    var exist=0;
    for(var i=0; i<drop.course.actualStudent.length; i++) {
      if(drop.course.actualStudent[i] == drop.newStudent) {
         drop.course.actualStudent.splice(i, 1);
         exist=1;
         break;
      }
    }
    if (!exist) {throw new Error("Student " + drop.newStudent.studentId +" is not in course: "+drop.course.courseName);}
    drop.course.actualStudentNumber-=1;
    const assetRegistry = await getAssetRegistry('org.selection.v1.Course');
    await assetRegistry.update(drop.course);
  
    for(var i=0; i<drop.newStudent.registeredCourse.length; i++) {
      if(drop.newStudent.registeredCourse[i] == drop.course) {
         drop.newStudent.registeredCourse.splice(i, 1);
         break;
      }
    }
    drop.newStudent.registeredCredits-=drop.course.credits;
    const ParticipantRegistry = await getParticipantRegistry('org.selection.v1.Student');
    await ParticipantRegistry.update(drop.newStudent);

}

/**
 * 
 * @param {org.selection.v1.endSemester} endSemester 
 * @transaction
 */
async function endSemester(endSemester) {    //update students information after one semester & delete all courses in courrent semester
  

        return getParticipantRegistry('org.selection.v1.Student')    //update student information
       .then(async function(studentRegistry){
    	return studentRegistry.getAll();
        })
  
        .then(async function(allStudent){   //allStudent is an array which stores every participant
    	
             var singleStudentRegistry;
 		     singleStudentRegistry = await getParticipantRegistry('org.selection.v1.Student');
         
             for (let i=0; i<allStudent.length; i++) {
               allStudent[i].totalCredits+=allStudent[i].registeredCredits;
               allStudent[i].registeredCredits=0;
               if (allStudent[i].totalCredits<32) {allStudent[i].studentYear=1;} 
               		else if (allStudent[i].totalCredits<64)  {allStudent[i].studentYear=2;}  
                      	else if (allStudent[i].totalCredits<96 ) {allStudent[i].studentYear=3;}
                             else {allStudent[i].studentYear=4;}
                 allStudent[i].registeredCourse.splice(0,allStudent[i].registeredCourse.length );	    
  			     await singleStudentRegistry.update(allStudent[i]);   //update
             }
          
             return getAssetRegistry('org.selection.v1.Course')  //delete finished course
       			.then(async function(courseRegistry){
    			return courseRegistry.getAll();
      		    })
  
        	.then(async function(allCourse){  
    	
       		 var singleCourseRegistry;
 			 singleCourseRegistry = await getAssetRegistry('org.selection.v1.Course');
             for (let i=0; i<allCourse.length; i++) {
                 await singleCourseRegistry.remove(allCourse[i]);  
                 } 
         	 })
          
      	})
       
}



/**
 * 
 * @param {org.selection.v1.decreasePrice} decreasePrice 
 * @transaction
 */
async function decreasePrice(decreasePrice) {    // Decrease the price by 1 (used to adjust the selection day)
  
       return getAssetRegistry('org.selection.v1.Course')
       .then(async function(courseRegistry){
    	return courseRegistry.getAll();
        })
  
        .then(async function(allCourse){  
    	
       		 var singleCourseRegistry;
 			 singleCourseRegistry = await getAssetRegistry('org.selection.v1.Course');
             for (let i=0; i<allCourse.length; i++) {
                allCourse[i].price-=1;
                await singleCourseRegistry.update(allCourse[i]);   //update
             }
 
      	})
}



/**
 * 
 * @param {org.selection.v1.startVotingSystem} startVotingSystem 
 * @transaction
 */
async function startVotingSystem(startVotingSystem) {      //Create a voting system with a name, action, targetCourse/targetStudent.
   
    const factory = getFactory();
    const pool = factory.newResource('org.selection.v1', 'Pool', startVotingSystem.newPoolName);
    
  
    pool.action=[];
    for( var i=0; i<startVotingSystem.action.length; i++){   //Record actions which users want to do.
    pool.action.push(startVotingSystem.action[i]);
    }
    pool.targetValue=startVotingSystem.targetValue;
    pool.targetCourse=startVotingSystem.targetCourse;
    pool.targetStudent=startVotingSystem.targetStudent;

    pool.actualStudent=[];   //Who vote for this pool
    pool.agreeData=[];       //There opinon, recorded in the same order as actualStudent
  
    const poolRegistry = await getAssetRegistry('org.selection.v1.Pool');  //Create a new asset which is pool
    await poolRegistry.addAll([pool]);
}




/**
 * 
 * @param {org.selection.v1.submitVote} submitVote 
 * @transaction
 */
async function submitVote(submitVote) {  
    if (submitVote.agree<0 ||submitVote.disagree<0)  throw new Error("opinion value can not be negative");
    if (submitVote.votingStudent.delegatedState==1)  throw new Error("You cannot vote. Beacasue student " + submitVote.votingStudent.studentId + " is already delegated by " +submitVote.votingStudent.targetDelegate        .studentId );
  
  
    var totalValue=submitVote.agree+submitVote.disagree;
    
    
   
    for(var i=0; i<submitVote.votingStudent.delegateStudent.length; i++) {
       submitVote.votingPool.actualStudent.push(submitVote.votingStudent.delegateStudent[i]); //Record student
       submitVote.votingPool.agreeData.push(submitVote.agree/totalValue);
    }
    var number=submitVote.votingStudent.delegateStudent.length;
    submitVote.votingPool.totalAgree+=number*submitVote.agree/totalValue;
    submitVote.votingPool.totalAgree=Math.round(submitVote.votingPool.totalAgree*1000)/1000  //Round to 2 decimal places
  
    submitVote.votingPool.totalDisagree+=number*submitVote.disagree/totalValue;
    submitVote.votingPool.totalDisagree=Math.round(submitVote.votingPool.totalDisagree*1000)/1000 //Round to 2 decimal places
   
  
    submitVote.votingPool.totalNumber+=number;
   
    const assetRegistry = await getAssetRegistry('org.selection.v1.Pool');
    await assetRegistry.update(submitVote.votingPool);
  


     submitVote.votingStudent.learningAgree=    ((submitVote.votingStudent.learningAgree*submitVote.votingStudent.time)+submitVote.agree)/(submitVote.votingStudent.time+1);
     submitVote.votingStudent.time+=1;
     const ParticipantRegistry = await getParticipantRegistry('org.selection.v1.Student');
     await ParticipantRegistry.update(submitVote.votingStudent);

     
    

}

/**
 * 
 * @param {org.selection.v1.endVotingSystem} endVotingSystem 
 * @transaction
 */
async function endVotingSystem(endVotingSystem) {    
  
   giveReward(endVotingSystem);
   var j=0;
   if(endVotingSystem.votingPool.totalAgree >  endVotingSystem.votingPool.totalDisagree ) {
        for(j=0; j<endVotingSystem.votingPool.action.length; j++){
              eval(endVotingSystem.votingPool.action[j]+"(endVotingSystem)");   //Do the actions
        }
           
   }
  
}



async function giveReward(endVotingSystem){
  
   participantRegistry = await getParticipantRegistry('org.selection.v1.Student');
  

   var agreeValue=0.0;
   var disagreeValue=0.0;
   var reward=0.0;
  
   // This is the peer prediction part. Using Quadratic Scoring Rules, make the user show there real opinion.
   for (var i=0;i<endVotingSystem.votingPool.actualStudent.length;i++){  
   agreeValue=endVotingSystem.votingPool.agreeData[i];
   disagreeValue=1-agreeValue;
   reward=0;
   reward+=(endVotingSystem.votingPool.totalAgree/endVotingSystem.votingPool.totalNumber)*(agreeValue-(1/2)*(agreeValue*agreeValue+disagreeValue*disagreeValue));
   reward+=(endVotingSystem.votingPool.totalDisagree /endVotingSystem.votingPool.totalNumber)*(disagreeValue-(1/2)*(agreeValue*agreeValue+disagreeValue*disagreeValue));
     
   endVotingSystem.votingPool.actualStudent[i].rewards+=Math.round(reward*1000)/1000;
       
    
   await participantRegistry.update(endVotingSystem.votingPool.actualStudent[i]); 
   }
  
 
  
}



/**
 * 
 * @param {org.selection.v1.delegateStudent} delegateStudent 
 * @transaction
 */
async function delegateStudent(delegateStudent) {
   if(delegateStudent.individual.delegatedState==0){
   delegateStudent.targetDelegate.delegateStudent.push(delegateStudent.individual);
     
   delegateStudent.individual.delegatedState=1;
   delegateStudent.individual.targetDelegate=delegateStudent.targetDelegate;
     
   for(var i=0; i<delegateStudent.individual.delegateStudent.length; i++) {
      if(delegateStudent.individual.delegateStudent[i] ==delegateStudent.individual) {
         delegateStudent.individual.delegateStudent.splice(i, 1);
         break;
      }
    }
     
   participantRegistry = await getParticipantRegistry('org.selection.v1.Student');
   await participantRegistry.update(delegateStudent.targetDelegate); 
   await participantRegistry.update(delegateStudent.individual); 
   }
   else {  throw new Error("Student " + delegateStudent.individual.studentId + " is already delegated by " +delegateStudent.individual.targetDelegate        .studentId ); }
     
}

/**
 * 
 * @param {org.selection.v1.cancleDelegate} cancleDelegate 
 * @transaction
 */
async function cancleDelegate(cancleDelegate) {    
   cancleDelegate.individual.delegatedState=0;
   
   for(var i=0; i<cancleDelegate.individual.targetDelegate.delegateStudent.length; i++) {
      if(cancleDelegate.individual.targetDelegate.delegateStudent[i] ==cancleDelegate.individual) {
         cancleDelegate.individual.targetDelegate.delegateStudent.splice(i, 1);
         break;
      }
    }
  
   participantRegistry = await getParticipantRegistry('org.selection.v1.Student');
   await participantRegistry.update(cancleDelegate.individual.targetDelegate); 
  
   cancleDelegate.individual.targetDelegate=cancleDelegate.individual;
 
   await participantRegistry.update(cancleDelegate.individual); 
 
}

 // These are action list which are generated automatically

async function action_capacity(endVotingSystem){
    endVotingSystem.votingPool.targetCourse.capacity=endVotingSystem.votingPool.targetValue;
    const assetRegistry = await getAssetRegistry('org.selection.v1.Course');
    await assetRegistry.update(endVotingSystem.votingPool.targetCourse);
}

async function action_price(endVotingSystem){
    endVotingSystem.votingPool.targetCourse.actualStudentNumber=endVotingSystem.votingPool.targetValue;;
    const assetRegistry = await getAssetRegistry('org.selection.v1.Course');
    await assetRegistry.update(endVotingSystem.votingPool.targetCourse);
}

async function action_credits(endVotingSystem){
    endVotingSystem.votingPool.targetCourse.credits=endVotingSystem.votingPool.targetValue;;
    const assetRegistry = await getAssetRegistry('org.selection.v1.Course');
    await assetRegistry.update(endVotingSystem.votingPool.targetCourse);
}
