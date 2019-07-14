Decentralized Course Selection System
====
---

Reasons for building this system:
----
1. When students take a class in another school, or several school form an alliance, students can use this decentralized system to select course instead of going to each registrar.
2. Suppose in some colleges, the registrar is not efficient or even corrupt.
3. Someone can hack into the system and change their courses.

Basic selection rules: 
---
Students with more credits can select first.

A student has a property "studentYear" which determines who select first.
For "studentYear", Senior (>=96 credits) is 4. Junior (>=64 credits) is 3. Sophomore (>=32 credits) is 2. Freshman (0<=credits<32) is 1.

On the first day, the price of a course is 4, only senior students can select courses.
After each day, the price is decreased by 1 until 0.

Transaction:
---
add(courseName,studentId) 

drop(courseName,studentId) 

endSemester()   //update students information after one semester & delete all courses in courrent semester

decreasePrice()   // decrease the price by 1 (used to adjust the selection day)

New Version:
---
1. Preprocessor adds the action list automatically.

2. We can assign a target value to the proposed actions.

3. Delegation is implemented.



Example:
----
     Create a participant with studentId "a1" and totalCredits "0", leave others as default.
     Create a participant with studentId "a4" and totalCredits "100", leave others as default.
     Click "Submit Transaction", choose "endSemester". This step will change the studentYear based on credits.
     Now, the studentYear of a4 is 4 which means a4 is a senior.
     
     Create a course with Name "b1", leave others as default.
     Click "Submit Transaction", choose "add". Edit the word after # in "course" raw to b1, the word after # in "newStudent" row to a4.
     Now, a4 registered for course b1.
     
     Click "Submit Transaction", choose "drop". Edit the word after # in "course" raw to b1, the word after # in "newStudent" row to a4.
     Now, a4 dropped from course b1.
     
     Add a4 back.
     Click "Submit Transaction", choose "endSemester". This transaction does 3 things for all students.
     First, add registeredCredits to totalCredits which means students get credits from the registered courses.
     Second, delete courses from students' registeredCourse[] which means they finish these courses.
     Third, delete all courses in asset.
