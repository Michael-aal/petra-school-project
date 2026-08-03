import 'dotenv/config';
import { studentService } from '../services/studentService.js';
import { prisma } from '../config/db.js';

const payload = {
  name: 'Test Student Diagnostic',
  gender: 'Male',
  className: 'SS1',
  dob: '2010-01-15',
  status: 'active',
  parentName: 'Diagnostic Parent',
  parentRelationship: 'Mother',
  parentEmail: 'diagnostic.parent@example.com',
  parentPhone: '+1234567890',
  parentAltPhone: '+1234567891',
  parentAddress: '123 Test Street',
  studentAddress: '456 Student Lane',
  passportPhoto: '',
  bloodGroup: 'A+',
  house: 'Blue',
  nationality: 'Testland',
  religion: 'Testism',
  medicalNotes: 'None',
  previousSchool: 'Test Primary School',
};

const main = async () => {
  try {
    console.log('START CREATE DEBUG');
    const student = await studentService.create(payload);
    console.log('CREATED STUDENT RESPONSE', JSON.stringify(student, null, 2));
    const dbStudent = await prisma.student.findUnique({
      where: { id: student.id },
      include: { profile: true, medicalInfo: true, parents: true, user: true },
    });
    console.log('DB STUDENT FOUND', JSON.stringify(dbStudent, null, 2));
  } catch (error) {
    console.error('CREATE ERROR', error);
    if (error instanceof Error) {
      console.error('ERROR STACK', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
};

main();
