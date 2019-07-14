#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <string>
#include <fstream>
using namespace std;


char fsm[9][128];

void initfsm()    //subfunction of deleteAnnotation
{
	const int line_len=sizeof(char)*128;
	memset(fsm[0],0,line_len);
	memset(fsm[1],0,line_len);
	memset(fsm[2],2,line_len);
	memset(fsm[3],3,line_len);
	memset(fsm[4],3,line_len);
	memset(fsm[5],5,line_len);
	memset(fsm[6],5,line_len);
	memset(fsm[7],0,line_len);
	memset(fsm[8],0,line_len);
	fsm[0]['/']=1;
	fsm[0]['"']=5;
	fsm[0]['\\']=8;
	fsm[1]['/']=2;
	fsm[1]['*']=3;
	fsm[1]['"']=5;
	fsm[2]['\n']=7;
	fsm[3]['*']=4;
	fsm[4]['/']=7;
	fsm[4]['*']=4;
	fsm[5]['"']=0;
	fsm[5]['\\']=6;
	fsm[7]['/']=1;
	fsm[7]['"']=5;
	fsm[7]['\\']=8;
}

void deleteAnnotation()  //delete annotation in given model
{
	int state=0;
	char c;	
	std::string s;
	FILE *fin=fopen("model.txt","r");
	FILE *fout=fopen("out.txt","w");
	initfsm();
	while(fscanf(fin,"%c",&c)!=EOF)
	{
		state=fsm[state][c];
		s+=c;
		switch(state)
		{
		case 0:
			fprintf(fout,"%s",s.c_str());
			s="";
			break;
		case 7:
			s="";
			if(c=='\n')
			{
				fputc(c,fout);
			}
			break;
		}
	}
	fclose(fin);
	fclose(fout);
}

void indentSymbol(){     //add a space before specific symbol to ensure this symbol will be read as a word.
	FILE *fin, *fout;
    char c;
    
    if ((fin=fopen("out.txt","r"))==NULL){
        perror("fopen filein");
        exit(0);
    } 
    if ((fout=fopen("out1.txt","w"))==NULL){
        perror("fopen fileout");
        exit(0);
    }
    while ((c=getc(fin))!=EOF){
		
		 if (c!= '>' && c!= '[' && c!= '{' && c!='}') putc(c,fout); 
		 if (c== '>') { putc(c,fout); putc(' ',fout);}
		 if (c== '[') { putc(' ',fout); putc(c,fout);}
		 if (c== '}') { putc(' ',fout); putc(c,fout);}
		 if (c== '{') { putc(' ',fout); putc(c,fout);}
	}
    fclose(fin);
    fclose(fout);
}

class atom {
public:
	string type;
	string name;
	string capitalType;
	int atomNumber;
	string variable[50][3]; //[type] [name] 

};

atom a[50];
string namespace1;
int atomNumber=0;

void createAtom(){
		fstream inFile("out1.txt");
	string word1,word2,word3,word4;
	inFile>>word1;
	inFile>>word2;
	inFile>>word3;

	int n=0; // current atom
	int m=0; //current parameter
	int t=0; //1 indicate we are going through a transaction (we do not need information about transaction

	while(inFile >> word4){

    if (!word1.compare("transaction") ) t=1;
	if (!word1.compare("}") ) t=0;

	if (!t){
		if (!word1.compare("namespace") ) {namespace1=word2;}
		if (!word1.compare("asset")  ) { n++; m=0; a[n].type=word1; a[n].name=word2; a[n].capitalType="Asset";}
	    if ( !word1.compare("participant") ) { n++; m=0; a[n].type=word1; a[n].name=word2; a[n].capitalType="Participant";}

		if (!word1.compare("o")) 
			if(!word3.compare("[]"))
		         { m++; a[n].variable[m][0]=word2.append(word3); a[n].variable[m][1]=word4; a[n].variable[m][2]="0";}  //0 means this variable has a reserved type, 1 means this variable has a type defiend by user.
		          else   { m++; a[n].variable[m][0]=word2; a[n].variable[m][1]=word3; a[n].variable[m][2]="0";} 
		if (!word1.compare("-->")) 
			if(!word3.compare("[]"))
		       { m++; a[n].variable[m][0]=word2.append(word3); a[n].variable[m][1]=word4; a[n].variable[m][2]="1";} //0 means this variable has a reserved type, 1 means this variable has a type defiend by user.
		         else   { m++; a[n].variable[m][0]=word2; a[n].variable[m][1]=word3; a[n].variable[m][2]="1";} 
	}

	word1=word2;
	word2=word3;
	word3=word4;
	if (!word4.compare("}") ) {a[n].atomNumber=m; }
	}

	int i,j;
	for (i=1;i<=n;i++){
		cout<<a[i].type<<" "<<a[i].name<<"\n";
		for (j=1; j<=a[i].atomNumber; j++)
			cout<<j<<" "<<a[i].variable[j][0]<<" "<<a[i].variable[j][1]<<"\n";
	}

	atomNumber=n;
}
int copyFile(char *SourceFile,char *NewFile)
{
ifstream in;
ofstream out;
in.open(SourceFile,ios::binary);
if(in.fail())
{
   cout<<"Error 1: Fail to open the source file."<<endl;
   in.close();
   out.close();
   return 0;
}
out.open(NewFile,ios::binary);
if(out.fail())
   cout<<"Error 2: Fail to create the new file."<<endl;
   out.close();
   in.close();
   return 0;
}
else
{
   out<<in.rdbuf();
   out.close();
   in.close();
   return 1;
}
}

int main(int argc, char * argv[]){
	
    deleteAnnotation();
	indentSymbol();
	createAtom();
	copyFile("Script.txt","ScriptAfter.txt");

	ofstream   ofresult( "ScriptAfter.txt",ios::app); 
	ofresult<<"\n\n // These are action list which are generated automatically\n"<<endl;

	int i,j;
	for (i=1;i<=atomNumber;i++){
		for (j=1; j<=a[i].atomNumber; j++)
		if (!a[i].variable[j][0].compare("Integer")){
			ofresult<<"async function action_"<<a[i].variable[j][1]<<"(endVotingSystem){"<<endl;
			ofresult<<"    endVotingSystem.votingPool.target"<<a[i].name<<"."<<a[i].variable[j][1]<<"+=1;"<<endl;
			ofresult<<"    const "<<a[i].type<<"Registry = await get"<<a[i].capitalType<< "Registry('"<<namespace1<<"."<<a[i].name<<"');"<<endl;
		    ofresult<<"    await "<<a[i].type<<"Registry.update(endVotingSystem.votingPool.target"<<a[i].name<<");" <<endl;
			ofresult<<"}\n"<<endl;
			}


	}




	


	int b;
	cin>>b;
    return 0;
}
