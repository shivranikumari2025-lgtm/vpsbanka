import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import School from '../src/models/School.js';
import Class from '../src/models/Class.js';
import Exam from '../src/models/Exam.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Create a sample school
    const school = await School.create({
      name: 'Krishna Valley School',
      description: 'A premier educational institution',
      address: '123 Main Street',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      phone: '+91-9876543210',
      email: 'info@schoollms.com',
      principal: 'Dr. Rajesh Kumar',
      established_year: 2010,
      is_demo: true,
    });
    console.log('✓ Created sample school');

    // Get or create teachers
    let teacher1 = await User.findOne({ email: 'teacher@schoollms.com' });
    let teacher2 = await User.findOne({ email: 'teacher2@schoollms.com' });

    if (!teacher2) {
      teacher2 = await User.create({
        email: 'teacher2@schoollms.com',
        password: 'Teacher2@123',
        full_name: 'Sarah Williams',
        role: 'teacher',
        school_id: school._id,
        is_demo: true,
      });
      console.log('✓ Created additional teacher');
    }

    // Get students
    let student1 = await User.findOne({ email: 'student@schoollms.com' });
    const students = [student1._id];

    // Create additional students
    for (let i = 2; i <= 5; i++) {
      let student = await User.findOne({ email: `student${i}@schoollms.com` });
      if (!student) {
        student = await User.create({
          email: `student${i}@schoollms.com`,
          password: 'Student@123',
          full_name: `Student ${i}`,
          role: 'student',
          school_id: school._id,
          is_demo: true,
        });
        console.log(`✓ Created student${i}`);
      }
      students.push(student._id);
    }

    // Create sample classes
    const class1 = await Class.create({
      name: 'Mathematics - Class 10',
      description: 'Mathematics concepts for grade 10',
      school_id: school._id,
      teacher_id: teacher1._id,
      students: students.slice(0, 3),
      grade: '10',
      section: 'A',
      is_demo: true,
    });
    console.log('✓ Created Class 1');

    const class2 = await Class.create({
      name: 'Science - Class 10',
      description: 'Physics, Chemistry, and Biology',
      school_id: school._id,
      teacher_id: teacher2._id,
      students: students.slice(1, 4),
      grade: '10',
      section: 'B',
      is_demo: true,
    });
    console.log('✓ Created Class 2');

    const class3 = await Class.create({
      name: 'English - Class 9',
      description: 'English literature and grammar',
      school_id: school._id,
      teacher_id: teacher1._id,
      students: students.slice(2, 5),
      grade: '9',
      section: 'A',
      is_demo: true,
    });
    console.log('✓ Created Class 3');

    // Create sample exams
    const exam1 = await Exam.create({
      title: 'Mathematics Mid-Term Exam',
      description: 'Mid-term examination for mathematics',
      class_id: class1._id,
      school_id: school._id,
      created_by: teacher1._id,
      exam_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      duration: 120,
      total_marks: 100,
      passing_marks: 40,
      is_demo: true,
    });
    console.log('✓ Created Exam 1');

    const exam2 = await Exam.create({
      title: 'Science Final Exam',
      description: 'Final examination for science',
      class_id: class2._id,
      school_id: school._id,
      created_by: teacher2._id,
      exam_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      duration: 180,
      total_marks: 150,
      passing_marks: 60,
      is_demo: true,
    });
    console.log('✓ Created Exam 2');

    const exam3 = await Exam.create({
      title: 'English Mid-Term Exam',
      description: 'Mid-term examination for English',
      class_id: class3._id,
      school_id: school._id,
      created_by: teacher1._id,
      exam_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      duration: 90,
      total_marks: 80,
      passing_marks: 32,
      is_demo: true,
    });
    console.log('✓ Created Exam 3');

    console.log('\n✅ Sample data created successfully!');
    console.log('\nSummary:');
    console.log('- 1 School created');
    console.log('- 2 Teachers (1 existing + 1 new)');
    console.log('- 5 Students (1 existing + 4 new)');
    console.log('- 3 Classes created');
    console.log('- 3 Exams created');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();
