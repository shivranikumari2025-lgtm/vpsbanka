#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import School from '../src/models/School.js';
import Class from '../src/models/Class.js';
import Subject from '../src/models/Subject.js';
import Chapter from '../src/models/Chapter.js';
import Material from '../src/models/Material.js';
import Exam from '../src/models/Exam.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function setupDemo() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Clear existing demo data (optional - commented out for safety)
    // await User.deleteMany({ is_demo: true });
    // await School.deleteMany({ is_demo: true });
    // await Class.deleteMany({ is_demo: true });
    // console.log('✓ Cleared old demo data\n');

    // 1. Create or get demo school
    console.log('📚 Setting up Demo School...');
    let school = await School.findOne({ name: 'EduCloud Demo School' });
    if (!school) {
      school = await School.create({
        name: 'EduCloud Demo School',
        code: 'EDUCLOUD-DEMO-' + Date.now(), // Unique code
        description: 'Demo school for testing EduCloud LMS',
        address: '123 Education Street',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        phone: '+91-9876543210',
        email: 'demo@educloud.com',
        principal_name: 'Dr. Demo Principal',
        principal_email: 'principal@educloud.com',
        established_year: 2020,
        is_demo: true,
      });
      console.log(`✓ Created school: ${school.name} (ID: ${school._id})\n`);
    } else {
      console.log(`✓ School already exists: ${school.name} (ID: ${school._id})\n`);
    }

    // 2. Create or get demo users with school assignment
    console.log('👥 Setting up Demo Users...');
    const demoUsers = {
      superadmin: {
        email: 'superadmin@educloud.com',
        password: 'SuperAdmin@123',
        full_name: 'Super Admin',
        role: 'super_admin',
      },
      admin: {
        email: 'admin@school.com',
        password: 'Admin@123',
        full_name: 'School Admin',
        role: 'admin',
      },
      teacher: {
        email: 'teacher@school.com',
        password: 'Teacher@123',
        full_name: 'Mr. Rajesh Kumar',
        role: 'teacher',
      },
      student: {
        email: 'student@school.com',
        password: 'Student@123',
        full_name: 'Aarav Sharma',
        role: 'student',
      },
    };

    const users = {};
    for (const [key, userData] of Object.entries(demoUsers)) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({
          ...userData,
          school_id: school._id, // ✅ ASSIGN SCHOOL TO EVERY DEMO USER
          is_demo: true,
        });
        console.log(`✓ Created ${key}: ${userData.email}`);
      } else {
        // Update school_id if not set
        if (!user.school_id) {
          user.school_id = school._id;
          await user.save();
          console.log(`✓ Updated ${key} with school assignment`);
        } else {
          console.log(`✓ ${key} already exists with school`);
        }
      }
      users[key] = user;
    }
    console.log('');

    // 3. Create demo classes
    console.log('🎓 Setting up Demo Classes...');
    const classes = [];

    const class1 = await Class.findOne({ name: 'Mathematics - Grade 10', is_demo: true });
    if (!class1) {
      const c1 = await Class.create({
        name: 'Mathematics - Grade 10',
        description: 'Algebra, Geometry, and Trigonometry for Grade 10 students',
        school_id: school._id,
        teacher_id: users.teacher._id,
        grade_level: 10,
        students: [users.student._id],
        is_demo: true,
      });
      classes.push(c1);
      console.log(`✓ Created: Mathematics - Grade 10`);
    } else {
      classes.push(class1);
      console.log(`✓ Math class already exists`);
    }

    const class2 = await Class.findOne({ name: 'Science - Grade 10', is_demo: true });
    if (!class2) {
      const c2 = await Class.create({
        name: 'Science - Grade 10',
        description: 'Physics, Chemistry, and Biology fundamentals',
        school_id: school._id,
        teacher_id: users.teacher._id,
        grade_level: 10,
        students: [users.student._id],
        is_demo: true,
      });
      classes.push(c2);
      console.log(`✓ Created: Science - Grade 10`);
    } else {
      classes.push(class2);
      console.log(`✓ Science class already exists`);
    }

    const class3 = await Class.findOne({ name: 'English - Grade 9', is_demo: true });
    if (!class3) {
      const c3 = await Class.create({
        name: 'English - Grade 9',
        description: 'English Literature, Grammar, and Communication Skills',
        school_id: school._id,
        teacher_id: users.teacher._id,
        grade_level: 9,
        students: [users.student._id],
        is_demo: true,
      });
      classes.push(c3);
      console.log(`✓ Created: English - Grade 9`);
    } else {
      classes.push(class3);
      console.log(`✓ English class already exists`);
    }
    console.log('');

    // 4. Create subjects for each class
    console.log('📖 Setting up Subjects...');
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const SUBJECT_CODES = ['MATH', 'SCI', 'ENG'];

    const subjectMap = {};
    for (let i = 0; i < classes.length; i++) {
      const cls = classes[i];
      let subject = await Subject.findOne({ 
        class_id: cls._id, 
        is_demo: true 
      });
      
      if (!subject) {
        const subjectName = cls.name.split(' - ')[0]; // Use subject name from class
        subject = await Subject.create({
          name: subjectName,
          code: SUBJECT_CODES[i] || `SUB${i}`,
          description: `${cls.description}`,
          class_id: cls._id,
          school_id: school._id,
          teacher_id: users.teacher._id,
          is_demo: true,
        });
        console.log(`✓ Created subject: ${subject.name} for ${cls.name}`);
      } else {
        console.log(`✓ Subject already exists for ${cls.name}`);
      }
      subjectMap[cls._id] = subject;
    }
    console.log('');

    // 5. Create chapters with content
    console.log('📚 Setting up Chapters & Content...');
    const chapters = [];
    
    for (const [classId, subject] of Object.entries(subjectMap)) {
      const chapter1 = await Chapter.findOne({
        subject_id: subject._id,
        name: 'Chapter 1: Introduction',
        is_demo: true
      });

      if (!chapter1) {
        const ch1 = await Chapter.create({
          subject_id: subject._id,
          class_id: subject.class_id,
          school_id: school._id,
          teacher_id: users.teacher._id,
          chapter_number: 1,
          name: 'Chapter 1: Introduction',
          description: `Introduction to ${subject.name} - Fundamental concepts`,
          is_published: true,
          is_demo: true,
        });
        chapters.push(ch1);
        console.log(`✓ Created: Chapter 1 for ${subject.name}`);

        // Create materials for this chapter
        await Material.create({
          chapter_id: ch1._id,
          subject_id: subject._id,
          class_id: subject.class_id,
          school_id: school._id,
          uploaded_by: users.teacher._id,
          title: `${subject.name} Lecture Notes`,
          type: 'notes',
          description: `Comprehensive notes for introduction to ${subject.name}`,
          file_type: 'pdf',
          is_demo: true,
        });
        console.log(`  ├─ Added: Lecture Notes`);

        await Material.create({
          chapter_id: ch1._id,
          subject_id: subject._id,
          class_id: subject.class_id,
          school_id: school._id,
          uploaded_by: users.teacher._id,
          title: `${subject.name} Basics Video`,
          type: 'video',
          description: `Video lesson on ${subject.name} basics`,
          file_type: 'video/mp4',
          is_demo: true,
        });
        console.log(`  ├─ Added: Video Lesson`);

        await Material.create({
          chapter_id: ch1._id,
          subject_id: subject._id,
          class_id: subject.class_id,
          school_id: school._id,
          uploaded_by: users.teacher._id,
          title: `${subject.name} Practice Problems`,
          type: 'question_bank',
          description: `Practice questions for ${subject.name}`,
          file_type: 'pdf',
          is_demo: true,
        });
        console.log(`  └─ Added: Practice Problems`);
      } else {
        chapters.push(chapter1);
        console.log(`✓ Chapter 1 already exists for ${subject.name}`);
      }

      const chapter2 = await Chapter.findOne({
        subject_id: subject._id,
        name: 'Chapter 2: Advanced Concepts',
        is_demo: true
      });

      if (!chapter2) {
        const ch2 = await Chapter.create({
          subject_id: subject._id,
          class_id: subject.class_id,
          school_id: school._id,
          teacher_id: users.teacher._id,
          chapter_number: 2,
          name: 'Chapter 2: Advanced Concepts',
          description: `Advanced topics in ${subject.name}`,
          is_published: true,
          is_demo: true,
        });
        chapters.push(ch2);
        console.log(`✓ Created: Chapter 2 for ${subject.name}`);

        // Create materials
        await Material.create({
          chapter_id: ch2._id,
          subject_id: subject._id,
          class_id: subject.class_id,
          school_id: school._id,
          uploaded_by: users.teacher._id,
          title: `${subject.name} Advanced Notes`,
          type: 'notes',
          description: `Advanced concepts in ${subject.name}`,
          file_type: 'pdf',
          is_demo: true,
        });
        console.log(`  ├─ Added: Advanced Notes`);

        await Material.create({
          chapter_id: ch2._id,
          subject_id: subject._id,
          class_id: subject.class_id,
          school_id: school._id,
          uploaded_by: users.teacher._id,
          title: `${subject.name} Mock Exam`,
          type: 'exam_practice',
          description: `Mock exam for practice`,
          file_type: 'pdf',
          is_demo: true,
        });
        console.log(`  └─ Added: Mock Exam`);
      } else {
        chapters.push(chapter2);
        console.log(`✓ Chapter 2 already exists for ${subject.name}`);
      }
    }
    console.log('');

    // 6. Create demo exams
    console.log('📝 Setting up Exams...');
    const exam1 = await Exam.findOne({ title: 'Mathematics Mid-Term Exam', is_demo: true });
    if (!exam1) {
      await Exam.create({
        title: 'Mathematics Mid-Term Exam',
        description: 'Mid-term examination for Mathematics Grade 10',
        class_id: classes[0]._id,
        school_id: school._id,
        created_by: users.teacher._id,
        exam_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 120,
        total_marks: 100,
        passing_marks: 40,
        is_demo: true,
      });
      console.log(`✓ Created: Mathematics Mid-Term Exam`);
    } else {
      console.log(`✓ Math exam already exists`);
    }

    const exam2 = await Exam.findOne({ title: 'Science Final Exam', is_demo: true });
    if (!exam2) {
      await Exam.create({
        title: 'Science Final Exam',
        description: 'Final examination for Science Grade 10',
        class_id: classes[1]._id,
        school_id: school._id,
        created_by: users.teacher._id,
        exam_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        duration: 180,
        total_marks: 150,
        passing_marks: 60,
        is_demo: true,
      });
      console.log(`✓ Created: Science Final Exam`);
    } else {
      console.log(`✓ Science exam already exists`);
    }

    const exam3 = await Exam.findOne({ title: 'English Mid-Term Exam', is_demo: true });
    if (!exam3) {
      await Exam.create({
        title: 'English Mid-Term Exam',
        description: 'Mid-term examination for English Grade 9',
        class_id: classes[2]._id,
        school_id: school._id,
        created_by: users.teacher._id,
        exam_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        duration: 90,
        total_marks: 80,
        passing_marks: 32,
        is_demo: true,
      });
      console.log(`✓ Created: English Mid-Term Exam`);
    } else {
      console.log(`✓ English exam already exists`);
    }
    console.log('');

    console.log('✅ Demo data setup completed successfully!\n');
    console.log('📋 Demo Credentials:');
    console.log('   👑 Super Admin:  superadmin@educloud.com / SuperAdmin@123');
    console.log('   🏫 Admin:        admin@school.com / Admin@123');
    console.log('   👨‍🏫 Teacher:       teacher@school.com / Teacher@123');
    console.log('   🎓 Student:      student@school.com / Student@123\n');
    console.log('📚 All users have been assigned to: EduCloud Demo School');
    console.log('✓ 3 Classes created (Math, Science, English)');
    console.log('✓ 3 Subjects created (one per class)');
    console.log('✓ 6 Chapters created (2 per subject)');
    console.log('✓ 12 Materials created (notes, videos, practice problems)');
    console.log('✓ 3 Exams created (one per class)\n');

    await mongoose.disconnect();
    console.log('Database connection closed.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    if (error.errors) {
      Object.values(error.errors).forEach(err => {
        console.error(`  - ${err.message}`);
      });
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

setupDemo();
