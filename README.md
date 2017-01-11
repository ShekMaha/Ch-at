# Ch-at

### Description:

This application allows students and instructors to engage actively during class time. It is a chat application in which both students and instructors can sign up and enrol in a particular classroom where each classroom is a separate chatroom.

### Getting Started:

Upon entering the home page, a new user can click on register to be directed to the registration page. New users can register using their email and set a username and password to access this application in the future.

Existing users can simply log in using their username and password which will direct them to the main page.

In this page, they can view their courses on the left bar. By clicking on the profile button, they can view their current courses, remove course or add course.

### Core Application (Student's Perspective):

By clicking on one of the courses on the left bar, they will be able to enter the chat room for that particular course and chat away.

Tags: These are located on the bottom right corner which a student can select to send a question or suggestion to the instructor of that class. When such a tag is selected and a message is sent, it can only be viewed by an instructor.

### Core Application (Instructor's Perspective):

An instructor also signs in like a student. Except when they click the courses on the left that they are teaching, they will be able to view the questions/suggestions of students from that particular course.

An instructor will be allowed to sort through the tags to view just questions or suggestions. They can reply to that question/suggesion which goes into the regular view for all students in that chat room.

### Techonologies/Extras:

Application is made using Node backend with a No-SQL database (Mongo) hosted using Heroku

The chatting system is powered by socket.io library

Users can update their information from the profile page

Passwords are encrypted and stored in our database

