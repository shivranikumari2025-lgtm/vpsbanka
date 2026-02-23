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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function resetDemoUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Delete all demo data
    await User.deleteMany({ is_demo: true });
    await School.deleteMany({ is_demo: true });
    await Class.deleteMany({ is_demo: true });
    await Subject.deleteMany({ is_demo: true });
    await Chapter.deleteMany({ is_demo: true });
    await Material.deleteMany({ is_demo: true });
    console.log('✓ Deleted all demo data');

    // Create demo school FIRST
    const school = await School.create({
      name: 'Demo School',
      code: 'DEMO-SCH-001',
      description: 'Demo school for testing all features',
      address: '123 Demo Street',
      city: 'Demo City',
      state: 'Demo State',
      country: 'Demo Country',
      principal_name: 'Demo Principal',
      established_year: 2024,
      is_demo: true,
    });
    console.log('✓ Created demo school');

    // Create demo users with school_id assigned
    const demoUsers = [
      {
        email: 'superadmin@schoollms.com',
        password: 'SuperAdmin@123',
        full_name: 'Super Admin',
        role: 'super_admin',
        school_id: school._id,
        is_demo: true,
      },
      {
        email: 'admin@schoollms.com',
        password: 'Admin@123',
        full_name: 'School Admin',
        role: 'admin',
        school_id: school._id,
        is_demo: true,
      },
      {
        email: 'teacher@schoollms.com',
        password: 'Teacher@123',
        full_name: 'John Teacher',
        role: 'teacher',
        school_id: school._id,
        is_demo: true,
      },
      {
        email: 'student@schoollms.com',
        password: 'Student@123',
        full_name: 'Jane Student',
        role: 'student',
        school_id: school._id,
        is_demo: true,
      },
    ];

    const users = {};
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      users[userData.role] = user;
      console.log(`✓ Created ${userData.email}`);
    }

    // Create demo classes
    console.log('\n📚 Creating demo classes and content...');
    
    const class1 = await Class.create({
      name: 'Mathematics - Class 10',
      description: 'Complete mathematics course for grade 10 with algebra, geometry, and trigonometry',
      school_id: school._id,
      teacher_id: users.teacher._id,
      students: [users.student._id],
      grade_level: 10,
      is_demo: true,
    });
    console.log('✓ Created Mathematics Class');

    const class2 = await Class.create({
      name: 'Science - Class 10',
      description: 'Physics, Chemistry, and Biology with practical experiments',
      school_id: school._id,
      teacher_id: users.teacher._id,
      students: [users.student._id],
      grade_level: 10,
      is_demo: true,
    });
    console.log('✓ Created Science Class');

    const class3 = await Class.create({
      name: 'English - Class 9',
      description: 'English literature, grammar, and communication skills',
      school_id: school._id,
      teacher_id: users.teacher._id,
      students: [users.student._id],
      grade_level: 9,
      is_demo: true,
    });
    console.log('✓ Created English Class');

    // Create subjects
    const mathSubject = await Subject.create({
      name: 'Algebra',
      code: 'MATH-ALG',
      description: 'Algebraic equations and functions',
      class_id: class1._id,
      school_id: school._id,
      teacher_id: users.teacher._id,
      color: '#3B82F6',
      is_demo: true,
    });

    const scienceSubject = await Subject.create({
      name: 'Physics',
      code: 'SCI-PHY',
      description: 'Mechanics, electricity, and magnetism',
      class_id: class2._id,
      school_id: school._id,
      teacher_id: users.teacher._id,
      color: '#10B981',
      is_demo: true,
    });

    const englishSubject = await Subject.create({
      name: 'Literature',
      code: 'ENG-LIT',
      description: 'English literature and poetry',
      class_id: class3._id,
      school_id: school._id,
      teacher_id: users.teacher._id,
      color: '#F59E0B',
      is_demo: true,
    });
    console.log('✓ Created demo subjects');

    // Create chapters
    const chapter1 = await Chapter.create({
      name: 'Linear Equations',
      chapter_number: 1,
      description: 'Understanding and solving linear equations',
      subject_id: mathSubject._id,
      class_id: class1._id,
      school_id: school._id,
      teacher_id: users.teacher._id,
      is_demo: true,
    });

    const chapter2 = await Chapter.create({
      name: 'Quadratic Equations',
      chapter_number: 2,
      description: 'Solving quadratic equations using various methods',
      subject_id: mathSubject._id,
      class_id: class1._id,
      school_id: school._id,
      teacher_id: users.teacher._id,
      is_demo: true,
    });

    const chapter3 = await Chapter.create({
      name: 'Motion and Forces',
      chapter_number: 1,
      description: 'Newton\'s laws of motion and force calculations',
      subject_id: scienceSubject._id,
      class_id: class2._id,
      school_id: school._id,
      teacher_id: users.teacher._id,
      is_demo: true,
    });

    const chapter4 = await Chapter.create({
      name: 'Shakespeare Introduction',
      chapter_number: 1,
      description: 'Life and works of William Shakespeare',
      subject_id: englishSubject._id,
      class_id: class3._id,
      school_id: school._id,
      teacher_id: users.teacher._id,
      is_demo: true,
    });
    console.log('✓ Created demo chapters');

    // Create materials
    const materials = [
      {
        title: 'Linear Equations Lecture Notes',
        type: 'notes',
        chapter_id: chapter1._id,
        subject_id: mathSubject._id,
        class_id: class1._id,
        school_id: school._id,
        uploaded_by: users.teacher._id,
        is_demo: true,
      },
      {
        title: 'Solving Linear Equations - Step by Step',
        type: 'theory',
        chapter_id: chapter1._id,
        subject_id: mathSubject._id,
        class_id: class1._id,
        school_id: school._id,
        uploaded_by: users.teacher._id,
        is_demo: true,
      },
      {
        title: 'Linear Equations Practice Problems',
        type: 'question_bank',
        chapter_id: chapter1._id,
        subject_id: mathSubject._id,
        class_id: class1._id,
        school_id: school._id,
        uploaded_by: users.teacher._id,
        is_demo: true,
      },
      {
        title: 'Quadratic Formula Derivation',
        type: 'theory',
        chapter_id: chapter2._id,
        subject_id: mathSubject._id,
        class_id: class1._id,
        school_id: school._id,
        uploaded_by: users.teacher._id,
        is_demo: true,
      },
      {
        title: 'Quadratic Equations Exercise',
        type: 'assignment',
        chapter_id: chapter2._id,
        subject_id: mathSubject._id,
        class_id: class1._id,
        school_id: school._id,
        uploaded_by: users.teacher._id,
        is_demo: true,
      },
      {
        title: 'Newton\'s Laws Explained',
        type: 'notes',
        chapter_id: chapter3._id,
        subject_id: scienceSubject._id,
        class_id: class2._id,
        school_id: school._id,
        uploaded_by: users.teacher._id,
        is_demo: true,
      },
      {
        title: 'Motion Problems with Solutions',
        type: 'question_bank',
        chapter_id: chapter3._id,
        subject_id: scienceSubject._id,
        class_id: class2._id,
        school_id: school._id,
        uploaded_by: users.teacher._id,
        is_demo: true,
      },
      {
        title: 'Hamlet - Act 1 Summary',
        type: 'notes',
        chapter_id: chapter4._id,
        subject_id: englishSubject._id,
        class_id: class3._id,
        school_id: school._id,
        uploaded_by: users.teacher._id,
        is_demo: true,
      },
      {
        title: 'Shakespeare Biography',
        type: 'theory',
        chapter_id: chapter4._id,
        subject_id: englishSubject._id,
        class_id: class3._id,
        school_id: school._id,
        uploaded_by: users.teacher._id,
        is_demo: true,
      },
      {
        title: 'Shakespearean Literature Quiz',
        type: 'exam_practice',
        chapter_id: chapter4._id,
        subject_id: englishSubject._id,
        class_id: class3._id,
        school_id: school._id,
        uploaded_by: users.teacher._id,
        is_demo: true,
      },
    ];

    for (const materialData of materials) {
      await Material.create(materialData);
    }
    console.log('✓ Created 10 demo materials');

    console.log('\n✅ Demo setup completed successfully!');
    console.log('\n📝 Demo User Credentials:');
    console.log('   Super Admin: superadmin@schoollms.com / SuperAdmin@123');
    console.log('   Admin:       admin@schoollms.com / Admin@123');
    console.log('   Teacher:     teacher@schoollms.com / Teacher@123');
    console.log('   Student:     student@schoollms.com / Student@123');
    console.log('\n🏫 Demo School: Demo School');
    console.log('📚 Demo Classes: 3 classes with subjects and chapters');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

resetDemoUsers();
