import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create hostel
  const hostel = await prisma.hostel.create({
    data: {
      name: 'Nehru Hostel',
      code: 'NH-01',
      address: 'Campus Road, University Area',
      totalBlocks: 2,
      gender: 'MALE',
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@campusphere.edu',
      password: adminPassword,
      name: 'Dr. Rajesh Kumar',
      phone: '9876543210',
      role: 'ADMIN',
      hostelId: hostel.id,
    },
  });

  // Create warden
  const wardenPassword = await bcrypt.hash('warden123', 12);
  const warden = await prisma.user.create({
    data: {
      email: 'warden@campusphere.edu',
      password: wardenPassword,
      name: 'Prof. Suresh Sharma',
      phone: '9876543211',
      role: 'WARDEN',
      hostelId: hostel.id,
    },
  });

  // Assign warden to hostel
  await prisma.hostel.update({
    where: { id: hostel.id },
    data: { wardenId: warden.id },
  });

  // Create staff
  const staffPassword = await bcrypt.hash('staff123', 12);
  const staff = await prisma.user.create({
    data: {
      email: 'staff@campusphere.edu',
      password: staffPassword,
      name: 'Ramesh Patel',
      phone: '9876543212',
      role: 'STAFF',
      hostelId: hostel.id,
    },
  });

  // Create blocks
  const blockA = await prisma.block.create({
    data: { name: 'Block A', hostelId: hostel.id, floors: 4 },
  });
  const blockB = await prisma.block.create({
    data: { name: 'Block B', hostelId: hostel.id, floors: 4 },
  });

  // Create rooms and beds
  for (const block of [blockA, blockB]) {
    for (let floor = 1; floor <= 4; floor++) {
      for (let room = 1; room <= 5; room++) {
        const roomNum = `${block.name.slice(-1)}${floor}0${room}`;
        const createdRoom = await prisma.room.create({
          data: {
            roomNumber: roomNum,
            blockId: block.id,
            floor,
            type: 'DOUBLE',
            capacity: 2,
          },
        });

        await prisma.bed.createMany({
          data: [
            { bedNumber: `${roomNum}-B1`, roomId: createdRoom.id },
            { bedNumber: `${roomNum}-B2`, roomId: createdRoom.id },
          ],
        });
      }
    }
  }

  // Create student users
  const studentPassword = await bcrypt.hash('student123', 12);
  const studentNames = [
    { name: 'Arun Kumar', email: 'arun@student.edu', roll: 'CS2024001' },
    { name: 'Priya Singh', email: 'priya@student.edu', roll: 'CS2024002' },
    { name: 'Vikram Reddy', email: 'vikram@student.edu', roll: 'EC2024001' },
    { name: 'Sneha Gupta', email: 'sneha@student.edu', roll: 'ME2024001' },
    { name: 'Rahul Verma', email: 'rahul@student.edu', roll: 'CE2024001' },
  ];

  // Get first 5 beds
  const beds = await prisma.bed.findMany({ take: 5, orderBy: { bedNumber: 'asc' } });

  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const user = await prisma.user.create({
      data: {
        email: s.email,
        password: studentPassword,
        name: s.name,
        role: 'STUDENT',
        hostelId: hostel.id,
        studentProfile: {
          create: {
            rollNumber: s.roll,
            department: s.roll.substring(0, 2),
            year: 2,
            gender: 'MALE',
            parentName: `Parent of ${s.name}`,
            parentPhone: `98765432${20 + i}`,
            permanentAddress: `Address ${i + 1}, City, State`,
            status: 'APPROVED',
            joinDate: new Date('2024-07-15'),
            bedId: beds[i].id,
          },
        },
      },
    });

    // Mark bed as occupied
    await prisma.bed.update({ where: { id: beds[i].id }, data: { status: 'OCCUPIED' } });
  }

  // Update room statuses for occupied beds
  const occupiedRoomIds = [...new Set(beds.slice(0, 5).map((b) => b.roomId))];
  for (const roomId of occupiedRoomIds) {
    const roomBeds = await prisma.bed.findMany({ where: { roomId } });
    const occupiedCount = roomBeds.filter((b) => b.status === 'OCCUPIED').length;
    const status = occupiedCount === roomBeds.length ? 'OCCUPIED' : occupiedCount > 0 ? 'PARTIALLY_OCCUPIED' : 'AVAILABLE';
    await prisma.room.update({ where: { id: roomId }, data: { status: status as any } });
  }

  // Create sample mess menu
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
  const menus: Record<string, string[]> = {
    BREAKFAST: ['Idli Sambar', 'Poha', 'Bread Butter Jam', 'Upma', 'Dosa', 'Paratha', 'Cornflakes'],
    LUNCH: ['Rice Dal Sabzi', 'Rajma Rice', 'Chole Bhature', 'Biryani', 'Kadhi Rice', 'Pav Bhaji', 'Paneer Rice'],
    SNACKS: ['Tea Biscuits', 'Samosa', 'Bread Pakora', 'Vada Pav', 'Sandwich', 'Maggi', 'Fruit Salad'],
    DINNER: ['Roti Sabzi Dal', 'Noodles', 'Pulao Raita', 'Paratha Curry', 'Khichdi', 'Pasta', 'Fried Rice'],
  };

  for (const day of days) {
    for (const [meal, items] of Object.entries(menus)) {
      const idx = days.indexOf(day);
      await prisma.messMenu.create({
        data: {
          hostelId: hostel.id,
          dayOfWeek: day,
          mealType: meal as any,
          items: [items[idx]],
        },
      });
    }
  }

  // Create sample complaints
  const students = await prisma.studentProfile.findMany({ take: 3 });
  const rooms = await prisma.room.findMany({ take: 3 });

  await prisma.complaint.createMany({
    data: [
      {
        title: 'Fan not working',
        description: 'The ceiling fan in my room has stopped working since yesterday. It makes a weird noise when turned on.',
        category: 'ELECTRICAL',
        priority: 'HIGH',
        status: 'OPEN',
        studentId: students[0].id,
        hostelId: hostel.id,
        roomId: rooms[0].id,
      },
      {
        title: 'Water leakage in bathroom',
        description: 'There is continuous water leakage from the bathroom tap. Water is getting wasted.',
        category: 'PLUMBING',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        assignedToId: staff.id,
        studentId: students[1].id,
        hostelId: hostel.id,
        roomId: rooms[1].id,
      },
      {
        title: 'WiFi connectivity issues',
        description: 'The WiFi has been very slow in Block A, floor 2 for the past week.',
        category: 'INTERNET',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        assignedToId: staff.id,
        studentId: students[2].id,
        hostelId: hostel.id,
      },
    ],
  });

  // Create sample fee records
  for (const student of students) {
    await prisma.feeRecord.createMany({
      data: [
        {
          studentId: student.id,
          hostelId: hostel.id,
          type: 'HOSTEL_FEE',
          amount: 45000,
          dueDate: new Date('2026-04-15'),
          status: 'PENDING',
        },
        {
          studentId: student.id,
          hostelId: hostel.id,
          type: 'MESS_FEE',
          amount: 15000,
          dueDate: new Date('2026-04-01'),
          status: 'PAID',
          paidAmount: 15000,
          paidDate: new Date('2026-03-20'),
          paymentMethod: 'UPI',
        },
      ],
    });
  }

  console.log('Seed completed!');
  console.log('Admin: admin@campusphere.edu / admin123');
  console.log('Warden: warden@campusphere.edu / warden123');
  console.log('Staff: staff@campusphere.edu / staff123');
  console.log('Students: arun@student.edu / student123 (and others)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
