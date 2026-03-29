import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('Clearing existing data...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE event_rsvps, events, attendances, audit_logs, login_history,
    notifications, visitors, gate_passes, mess_bookings, mess_menus,
    fee_records, complaint_updates, complaints, beds, rooms, blocks,
    student_profiles, users, hostels CASCADE;
  `);

  console.log('Seeding database with Indian data...');
  const pw = await bcrypt.hash('admin123', 10);
  const studentPw = await bcrypt.hash('student123', 10);
  const staffPw = await bcrypt.hash('staff123', 10);
  const wardenPw = await bcrypt.hash('warden123', 10);

  // ═══════════════════════════════════════════
  // HOSTELS
  // ═══════════════════════════════════════════
  const hostelMale = await prisma.hostel.create({
    data: {
      name: 'Vivekananda Boys Hostel',
      code: 'VBH-01',
      address: 'Near Main Gate, Rajiv Gandhi Technical University Campus, Bhopal, MP 462033',
      totalBlocks: 3,
      gender: 'MALE',
    },
  });

  const hostelFemale = await prisma.hostel.create({
    data: {
      name: 'Sarojini Naidu Girls Hostel',
      code: 'SNGH-01',
      address: 'East Wing, Rajiv Gandhi Technical University Campus, Bhopal, MP 462033',
      totalBlocks: 2,
      gender: 'FEMALE',
    },
  });

  // ═══════════════════════════════════════════
  // ADMIN + SUPER ADMIN
  // ═══════════════════════════════════════════
  const superAdmin = await prisma.user.create({
    data: {
      email: 'dean@campusphere.edu',
      password: pw,
      name: 'Prof. Harish Chandra Verma',
      phone: '9425012345',
      role: 'SUPER_ADMIN',
      hostelId: hostelMale.id,
    },
  });

  const adminMale = await prisma.user.create({
    data: {
      email: 'admin@campusphere.edu',
      password: pw,
      name: 'Dr. Rajesh Tripathi',
      phone: '9425067890',
      role: 'ADMIN',
      hostelId: hostelMale.id,
    },
  });

  const adminFemale = await prisma.user.create({
    data: {
      email: 'admin.girls@campusphere.edu',
      password: pw,
      name: 'Dr. Meena Kulkarni',
      phone: '9425034567',
      role: 'ADMIN',
      hostelId: hostelFemale.id,
    },
  });

  // ═══════════════════════════════════════════
  // WARDENS
  // ═══════════════════════════════════════════
  const wardenMale = await prisma.user.create({
    data: {
      email: 'warden@campusphere.edu',
      password: wardenPw,
      name: 'Prof. Suresh Chandra Mishra',
      phone: '9425078901',
      role: 'WARDEN',
      hostelId: hostelMale.id,
    },
  });

  const wardenFemale = await prisma.user.create({
    data: {
      email: 'warden.girls@campusphere.edu',
      password: wardenPw,
      name: 'Dr. Kavitha Subramanian',
      phone: '9425089012',
      role: 'WARDEN',
      hostelId: hostelFemale.id,
    },
  });

  await prisma.hostel.update({ where: { id: hostelMale.id }, data: { wardenId: wardenMale.id } });
  await prisma.hostel.update({ where: { id: hostelFemale.id }, data: { wardenId: wardenFemale.id } });

  // ═══════════════════════════════════════════
  // STAFF (maintenance, electrician, security, mess)
  // ═══════════════════════════════════════════
  const staffData = [
    { name: 'Ramesh Yadav', email: 'ramesh.yadav@campusphere.edu', phone: '9425011111', hostelId: hostelMale.id },
    { name: 'Sunil Thakur', email: 'sunil.thakur@campusphere.edu', phone: '9425022222', hostelId: hostelMale.id },
    { name: 'Dinesh Soni', email: 'dinesh.soni@campusphere.edu', phone: '9425033333', hostelId: hostelMale.id },
    { name: 'Kamlesh Prajapati', email: 'kamlesh.p@campusphere.edu', phone: '9425044444', hostelId: hostelMale.id },
    { name: 'Sunita Devi', email: 'sunita.devi@campusphere.edu', phone: '9425055555', hostelId: hostelFemale.id },
    { name: 'Lakshmi Bai', email: 'lakshmi.bai@campusphere.edu', phone: '9425066666', hostelId: hostelFemale.id },
  ];

  const staffUsers: { id: string; hostelId: string }[] = [];
  for (const s of staffData) {
    const user = await prisma.user.create({
      data: { ...s, password: staffPw, role: 'STAFF' },
    });
    staffUsers.push({ id: user.id, hostelId: s.hostelId });
  }

  // ═══════════════════════════════════════════
  // BLOCKS & ROOMS
  // ═══════════════════════════════════════════
  const maleBlocks = [];
  for (const bName of ['Chanakya Block', 'Aryabhatta Block', 'Ramanujam Block']) {
    const block = await prisma.block.create({ data: { name: bName, hostelId: hostelMale.id, floors: 4 } });
    maleBlocks.push(block);
  }
  const femaleBlocks = [];
  for (const bName of ['Gargi Block', 'Maitreyi Block']) {
    const block = await prisma.block.create({ data: { name: bName, hostelId: hostelFemale.id, floors: 3 } });
    femaleBlocks.push(block);
  }

  const allBeds: { id: string; roomId: string; hostelId: string }[] = [];
  const allRooms: { id: string; blockId: string; hostelId: string }[] = [];

  const roomTypes: Array<{ type: 'SINGLE' | 'DOUBLE' | 'TRIPLE'; capacity: number }> = [
    { type: 'SINGLE', capacity: 1 },
    { type: 'DOUBLE', capacity: 2 },
    { type: 'TRIPLE', capacity: 3 },
  ];

  const amenitiesList = [
    ['WiFi', 'Fan', 'Desk', 'Wardrobe'],
    ['WiFi', 'Fan', 'AC', 'Desk', 'Wardrobe', 'Attached Bathroom'],
    ['WiFi', 'Fan', 'Desk', 'Wardrobe', 'Bookshelf'],
    ['WiFi', 'Fan', 'Desk'],
  ];

  for (const blocks of [maleBlocks, femaleBlocks]) {
    const hostelId = blocks === maleBlocks ? hostelMale.id : hostelFemale.id;
    const floors = blocks === maleBlocks ? 4 : 3;

    for (const block of blocks) {
      const prefix = block.name.charAt(0);
      for (let floor = 1; floor <= floors; floor++) {
        for (let room = 1; room <= 8; room++) {
          const roomNum = `${prefix}${floor}0${room}`;
          const rt = roomTypes[room <= 2 ? 0 : room <= 6 ? 1 : 2];
          const createdRoom = await prisma.room.create({
            data: {
              roomNumber: roomNum,
              blockId: block.id,
              floor,
              type: rt.type,
              capacity: rt.capacity,
              amenities: room <= 2 ? amenitiesList[1] : amenitiesList[Math.floor(Math.random() * amenitiesList.length)],
            },
          });
          allRooms.push({ id: createdRoom.id, blockId: block.id, hostelId });

          const bedData = Array.from({ length: rt.capacity }, (_, i) => ({
            bedNumber: `${roomNum}-B${i + 1}`,
            roomId: createdRoom.id,
          }));
          await prisma.bed.createMany({ data: bedData });
          const beds = await prisma.bed.findMany({ where: { roomId: createdRoom.id } });
          beds.forEach((b) => allBeds.push({ id: b.id, roomId: b.roomId, hostelId }));
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  // STUDENTS (25 male, 15 female)
  // ═══════════════════════════════════════════
  const maleStudents = [
    { name: 'Aarav Sharma', roll: 'CS2024001', dept: 'CSE', year: 2, parent: 'Shri Mahesh Sharma', parentPhone: '9826011001', address: '45, Arera Colony, Bhopal, MP 462016' },
    { name: 'Vihaan Patel', roll: 'CS2024002', dept: 'CSE', year: 2, parent: 'Shri Narendrabhai Patel', parentPhone: '9826011002', address: '12, Navrangpura, Ahmedabad, GJ 380009' },
    { name: 'Arjun Reddy', roll: 'CS2024003', dept: 'CSE', year: 2, parent: 'Shri Venkateshwar Reddy', parentPhone: '9826011003', address: '78, Banjara Hills, Hyderabad, TS 500034' },
    { name: 'Aditya Joshi', roll: 'EC2024001', dept: 'ECE', year: 2, parent: 'Shri Pradeep Joshi', parentPhone: '9826011004', address: '23, Model Town, Jabalpur, MP 482001' },
    { name: 'Sai Krishna Iyer', roll: 'EC2024002', dept: 'ECE', year: 2, parent: 'Shri Sundaram Iyer', parentPhone: '9826011005', address: '56, T Nagar, Chennai, TN 600017' },
    { name: 'Rohan Deshmukh', roll: 'ME2024001', dept: 'ME', year: 2, parent: 'Shri Suhas Deshmukh', parentPhone: '9826011006', address: '34, FC Road, Pune, MH 411004' },
    { name: 'Dev Malhotra', roll: 'ME2024002', dept: 'ME', year: 2, parent: 'Shri Rakesh Malhotra', parentPhone: '9826011007', address: '90, Sector 14, Gurgaon, HR 122001' },
    { name: 'Karthik Nair', roll: 'CE2024001', dept: 'CE', year: 2, parent: 'Shri Gopinath Nair', parentPhone: '9826011008', address: '67, MG Road, Ernakulam, KL 682011' },
    { name: 'Ishaan Tiwari', roll: 'CE2024002', dept: 'CE', year: 3, parent: 'Shri Ramkumar Tiwari', parentPhone: '9826011009', address: '15, Hazratganj, Lucknow, UP 226001' },
    { name: 'Anand Bhardwaj', roll: 'IT2024001', dept: 'IT', year: 2, parent: 'Shri Vishnu Bhardwaj', parentPhone: '9826011010', address: '28, Malviya Nagar, Jaipur, RJ 302017' },
    { name: 'Pranav Kulkarni', roll: 'IT2024002', dept: 'IT', year: 3, parent: 'Shri Sunil Kulkarni', parentPhone: '9826011011', address: '52, Koregaon Park, Pune, MH 411001' },
    { name: 'Vivek Chauhan', roll: 'CS2023001', dept: 'CSE', year: 3, parent: 'Shri Devendra Chauhan', parentPhone: '9826011012', address: '41, Civil Lines, Indore, MP 452001' },
    { name: 'Harsh Agarwal', roll: 'CS2023002', dept: 'CSE', year: 3, parent: 'Shri Manoj Agarwal', parentPhone: '9826011013', address: '19, Alkapuri, Vadodara, GJ 390007' },
    { name: 'Nikhil Saxena', roll: 'EC2023001', dept: 'ECE', year: 3, parent: 'Shri Ashok Saxena', parentPhone: '9826011014', address: '63, Saket Nagar, Bhopal, MP 462024' },
    { name: 'Amit Choudhary', roll: 'ME2023001', dept: 'ME', year: 3, parent: 'Shri Rajveer Choudhary', parentPhone: '9826011015', address: '8, Vaishali Nagar, Jaipur, RJ 302021' },
    { name: 'Rahul Pandey', roll: 'CS2022001', dept: 'CSE', year: 4, parent: 'Shri Shiv Pandey', parentPhone: '9826011016', address: '36, Gomti Nagar, Lucknow, UP 226010' },
    { name: 'Shubham Singh', roll: 'CS2022002', dept: 'CSE', year: 4, parent: 'Shri Ajay Singh', parentPhone: '9826011017', address: '72, Boring Road, Patna, BR 800001' },
    { name: 'Deepak Meena', roll: 'EC2022001', dept: 'ECE', year: 4, parent: 'Shri Babulal Meena', parentPhone: '9826011018', address: '14, Tonk Road, Jaipur, RJ 302015' },
    { name: 'Manish Rajput', roll: 'ME2022001', dept: 'ME', year: 4, parent: 'Shri Vikram Rajput', parentPhone: '9826011019', address: '55, Vijay Nagar, Indore, MP 452010' },
    { name: 'Tushar Dubey', roll: 'IT2023001', dept: 'IT', year: 3, parent: 'Shri Prakash Dubey', parentPhone: '9826011020', address: '29, Kolar Road, Bhopal, MP 462042' },
    { name: 'Gaurav Thakur', roll: 'CE2023001', dept: 'CE', year: 3, parent: 'Shri Mohan Thakur', parentPhone: '9826011021', address: '47, Shivaji Nagar, Nagpur, MH 440010' },
    { name: 'Abhishek Verma', roll: 'CS2025001', dept: 'CSE', year: 1, parent: 'Shri Dinesh Verma', parentPhone: '9826011022', address: '83, New Market, Bhopal, MP 462003' },
    { name: 'Kunal Rao', roll: 'EC2025001', dept: 'ECE', year: 1, parent: 'Shri Narayana Rao', parentPhone: '9826011023', address: '31, Basheerbagh, Hyderabad, TS 500029' },
    { name: 'Ravi Shankar Gupta', roll: 'ME2025001', dept: 'ME', year: 1, parent: 'Shri Balram Gupta', parentPhone: '9826011024', address: '16, Ashok Nagar, Bhopal, MP 462003' },
    { name: 'Mohit Dwivedi', roll: 'IT2025001', dept: 'IT', year: 1, parent: 'Shri Arvind Dwivedi', parentPhone: '9826011025', address: '59, Maharana Pratap Nagar, Bhopal, MP 462011' },
  ];

  const femaleStudents = [
    { name: 'Ananya Krishnamurthy', roll: 'CS2024F01', dept: 'CSE', year: 2, parent: 'Shri Raghunath Krishnamurthy', parentPhone: '9826022001', address: '22, Jayanagar, Bangalore, KA 560041' },
    { name: 'Priya Desai', roll: 'CS2024F02', dept: 'CSE', year: 2, parent: 'Shri Kishore Desai', parentPhone: '9826022002', address: '38, Satellite, Ahmedabad, GJ 380015' },
    { name: 'Sneha Patil', roll: 'EC2024F01', dept: 'ECE', year: 2, parent: 'Shri Shivaji Patil', parentPhone: '9826022003', address: '64, Kothrud, Pune, MH 411038' },
    { name: 'Kavya Menon', roll: 'EC2024F02', dept: 'ECE', year: 2, parent: 'Shri Krishnan Menon', parentPhone: '9826022004', address: '11, Thampanoor, Thiruvananthapuram, KL 695001' },
    { name: 'Ishita Banerjee', roll: 'ME2024F01', dept: 'ME', year: 2, parent: 'Shri Dipak Banerjee', parentPhone: '9826022005', address: '76, Salt Lake, Kolkata, WB 700064' },
    { name: 'Diya Shukla', roll: 'IT2024F01', dept: 'IT', year: 2, parent: 'Shri Ajay Shukla', parentPhone: '9826022006', address: '43, Habibganj, Bhopal, MP 462024' },
    { name: 'Riya Saxena', roll: 'CS2023F01', dept: 'CSE', year: 3, parent: 'Shri Vinod Saxena', parentPhone: '9826022007', address: '27, MP Nagar, Bhopal, MP 462011' },
    { name: 'Neha Srivastava', roll: 'CS2023F02', dept: 'CSE', year: 3, parent: 'Shri Alok Srivastava', parentPhone: '9826022008', address: '51, Hazratganj, Lucknow, UP 226001' },
    { name: 'Pooja Rathore', roll: 'EC2023F01', dept: 'ECE', year: 3, parent: 'Shri Bhupendra Rathore', parentPhone: '9826022009', address: '35, C-Scheme, Jaipur, RJ 302001' },
    { name: 'Shruti Nair', roll: 'CE2024F01', dept: 'CE', year: 2, parent: 'Shri Rajan Nair', parentPhone: '9826022010', address: '18, Marine Drive, Kochi, KL 682031' },
    { name: 'Aditi Pandey', roll: 'CS2022F01', dept: 'CSE', year: 4, parent: 'Shri Ramesh Pandey', parentPhone: '9826022011', address: '69, Alambagh, Lucknow, UP 226005' },
    { name: 'Mansi Jain', roll: 'IT2023F01', dept: 'IT', year: 3, parent: 'Shri Hemant Jain', parentPhone: '9826022012', address: '42, Palasia Square, Indore, MP 452001' },
    { name: 'Tanvi Gokhale', roll: 'ME2023F01', dept: 'ME', year: 3, parent: 'Shri Arun Gokhale', parentPhone: '9826022013', address: '24, Deccan Gymkhana, Pune, MH 411004' },
    { name: 'Sakshi Chaturvedi', roll: 'CS2025F01', dept: 'CSE', year: 1, parent: 'Shri Pankaj Chaturvedi', parentPhone: '9826022014', address: '57, Kolar Road, Bhopal, MP 462042' },
    { name: 'Nandini Pillai', roll: 'EC2025F01', dept: 'ECE', year: 1, parent: 'Shri Suresh Pillai', parentPhone: '9826022015', address: '33, Mylapore, Chennai, TN 600004' },
  ];

  const maleBeds = allBeds.filter((b) => b.hostelId === hostelMale.id);
  const femaleBeds = allBeds.filter((b) => b.hostelId === hostelFemale.id);
  const maleRooms = allRooms.filter((r) => r.hostelId === hostelMale.id);
  const femaleRooms = allRooms.filter((r) => r.hostelId === hostelFemale.id);

  const studentProfiles: { id: string; hostelId: string; userId: string }[] = [];
  let bedIdx = 0;

  // 2 pending male students (last 2)
  for (let i = 0; i < maleStudents.length; i++) {
    const s = maleStudents[i];
    const isPending = i >= maleStudents.length - 2;
    const user = await prisma.user.create({
      data: {
        email: `${s.roll.toLowerCase()}@student.edu`,
        password: studentPw,
        name: s.name,
        phone: `98260${(11000 + i).toString()}`,
        role: 'STUDENT',
        hostelId: hostelMale.id,
        studentProfile: {
          create: {
            rollNumber: s.roll,
            department: s.dept,
            year: s.year,
            gender: 'MALE',
            parentName: s.parent,
            parentPhone: s.parentPhone,
            permanentAddress: s.address,
            status: isPending ? 'PENDING' : 'APPROVED',
            joinDate: isPending ? undefined : new Date('2024-07-15'),
            bedId: isPending ? undefined : maleBeds[bedIdx]?.id,
          },
        },
      },
      include: { studentProfile: true },
    });

    if (!isPending && maleBeds[bedIdx]) {
      await prisma.bed.update({ where: { id: maleBeds[bedIdx].id }, data: { status: 'OCCUPIED' } });
      bedIdx++;
    }
    if (user.studentProfile) {
      studentProfiles.push({ id: user.studentProfile.id, hostelId: hostelMale.id, userId: user.id });
    }
  }

  let fBedIdx = 0;
  for (let i = 0; i < femaleStudents.length; i++) {
    const s = femaleStudents[i];
    const isPending = i >= femaleStudents.length - 2;
    const user = await prisma.user.create({
      data: {
        email: `${s.roll.toLowerCase()}@student.edu`,
        password: studentPw,
        name: s.name,
        phone: `98260${(22000 + i).toString()}`,
        role: 'STUDENT',
        hostelId: hostelFemale.id,
        studentProfile: {
          create: {
            rollNumber: s.roll,
            department: s.dept,
            year: s.year,
            gender: 'FEMALE',
            parentName: s.parent,
            parentPhone: s.parentPhone,
            permanentAddress: s.address,
            status: isPending ? 'PENDING' : 'APPROVED',
            joinDate: isPending ? undefined : new Date('2024-07-15'),
            bedId: isPending ? undefined : femaleBeds[fBedIdx]?.id,
          },
        },
      },
      include: { studentProfile: true },
    });

    if (!isPending && femaleBeds[fBedIdx]) {
      await prisma.bed.update({ where: { id: femaleBeds[fBedIdx].id }, data: { status: 'OCCUPIED' } });
      fBedIdx++;
    }
    if (user.studentProfile) {
      studentProfiles.push({ id: user.studentProfile.id, hostelId: hostelFemale.id, userId: user.id });
    }
  }

  // Update room statuses
  const occupiedRoomIds = new Set([
    ...maleBeds.slice(0, bedIdx).map((b) => b.roomId),
    ...femaleBeds.slice(0, fBedIdx).map((b) => b.roomId),
  ]);
  for (const roomId of occupiedRoomIds) {
    const beds = await prisma.bed.findMany({ where: { roomId } });
    const occ = beds.filter((b) => b.status === 'OCCUPIED').length;
    const status = occ === beds.length ? 'OCCUPIED' : occ > 0 ? 'PARTIALLY_OCCUPIED' : 'AVAILABLE';
    await prisma.room.update({ where: { id: roomId }, data: { status: status as any } });
  }

  // Mark a couple rooms as under maintenance
  const maintRooms = maleRooms.slice(-3);
  for (const r of maintRooms) {
    await prisma.room.update({ where: { id: r.id }, data: { status: 'UNDER_MAINTENANCE' } });
    await prisma.bed.updateMany({ where: { roomId: r.id }, data: { status: 'MAINTENANCE' } });
  }

  // ═══════════════════════════════════════════
  // MESS MENUS (proper Indian meals)
  // ═══════════════════════════════════════════
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
  const indianMenus: Record<string, string[][]> = {
    BREAKFAST: [
      ['Aloo Paratha', 'Curd', 'Pickle', 'Chai'],
      ['Poha', 'Jalebi', 'Chai', 'Banana'],
      ['Idli', 'Sambar', 'Coconut Chutney', 'Filter Coffee'],
      ['Chole Bhature', 'Lassi', 'Green Chutney'],
      ['Masala Dosa', 'Sambar', 'Tomato Chutney', 'Coffee'],
      ['Upma', 'Vada', 'Coconut Chutney', 'Chai'],
      ['Puri', 'Aloo Sabzi', 'Halwa', 'Chai'],
    ],
    LUNCH: [
      ['Rajma', 'Jeera Rice', 'Roti', 'Salad', 'Raita'],
      ['Kadhi Pakora', 'Steamed Rice', 'Roti', 'Achar'],
      ['Paneer Butter Masala', 'Dal Fry', 'Rice', 'Naan'],
      ['Chole', 'Rice', 'Roti', 'Boondi Raita', 'Salad'],
      ['Dal Makhani', 'Jeera Rice', 'Tandoori Roti', 'Salad'],
      ['Veg Biryani', 'Mirchi Ka Salan', 'Raita', 'Gulab Jamun'],
      ['Shahi Paneer', 'Dal Tadka', 'Rice', 'Roti', 'Kheer'],
    ],
    SNACKS: [
      ['Samosa', 'Green Chutney', 'Chai'],
      ['Bread Pakora', 'Tomato Sauce', 'Chai'],
      ['Vada Pav', 'Garlic Chutney', 'Chai'],
      ['Aloo Tikki', 'Chole', 'Chai'],
      ['Dhokla', 'Green Chutney', 'Chai'],
      ['Poha', 'Sev', 'Nimbu Pani'],
      ['Kachori', 'Aloo Sabzi', 'Chai'],
    ],
    DINNER: [
      ['Aloo Gobi', 'Dal Tadka', 'Roti', 'Rice', 'Salad'],
      ['Palak Paneer', 'Yellow Dal', 'Roti', 'Rice'],
      ['Mix Veg', 'Masoor Dal', 'Roti', 'Rice', 'Papad'],
      ['Matar Paneer', 'Dal Fry', 'Roti', 'Rice', 'Pickle'],
      ['Baingan Bharta', 'Arhar Dal', 'Roti', 'Rice'],
      ['Malai Kofta', 'Dal Makhani', 'Naan', 'Rice', 'Ice Cream'],
      ['Chana Masala', 'Jeera Rice', 'Roti', 'Raita'],
    ],
  };

  for (const hostel of [hostelMale, hostelFemale]) {
    for (let d = 0; d < days.length; d++) {
      for (const [meal, items] of Object.entries(indianMenus)) {
        await prisma.messMenu.create({
          data: { hostelId: hostel.id, dayOfWeek: days[d], mealType: meal as any, items: items[d] },
        });
      }
    }
  }

  // ═══════════════════════════════════════════
  // COMPLAINTS (15 total, various statuses)
  // ═══════════════════════════════════════════
  const maleProfiles = studentProfiles.filter((s) => s.hostelId === hostelMale.id);
  const femaleProfiles = studentProfiles.filter((s) => s.hostelId === hostelFemale.id);
  const maleStaff = staffUsers.filter((s) => s.hostelId === hostelMale.id);
  const femaleStaff = staffUsers.filter((s) => s.hostelId === hostelFemale.id);

  const complaints = [
    { title: 'Ceiling fan making grinding noise', desc: 'The ceiling fan in my room has been making a loud grinding noise for 3 days. It vibrates badly at high speed.', cat: 'ELECTRICAL', pri: 'HIGH', status: 'OPEN', hostel: hostelMale.id, student: maleProfiles[0].id },
    { title: 'Bathroom tap leaking continuously', desc: 'Hot water tap in the bathroom is dripping non-stop. Wasting a lot of water. Tried tightening but no use.', cat: 'PLUMBING', pri: 'MEDIUM', status: 'ASSIGNED', hostel: hostelMale.id, student: maleProfiles[1].id, assignee: maleStaff[0].id },
    { title: 'WiFi not working on 2nd floor', desc: 'WiFi signal is extremely weak on the entire 2nd floor of Chanakya Block. Cannot attend online lectures.', cat: 'INTERNET', pri: 'URGENT', status: 'IN_PROGRESS', hostel: hostelMale.id, student: maleProfiles[2].id, assignee: maleStaff[1].id },
    { title: 'Broken window latch', desc: 'The window latch in room C302 is broken. Window cannot be closed properly during rain.', cat: 'FURNITURE', pri: 'MEDIUM', status: 'RESOLVED', hostel: hostelMale.id, student: maleProfiles[3].id, assignee: maleStaff[0].id, resolvedAt: new Date('2026-03-25') },
    { title: 'Cockroach infestation in washroom', desc: 'There are cockroaches in the common washroom near room A201. Very unhygienic. Need pest control.', cat: 'PEST_CONTROL', pri: 'HIGH', status: 'OPEN', hostel: hostelMale.id, student: maleProfiles[4].id },
    { title: 'Tube light flickering', desc: 'The tube light in room A103 keeps flickering. Causing eye strain while studying at night.', cat: 'ELECTRICAL', pri: 'LOW', status: 'ASSIGNED', hostel: hostelMale.id, student: maleProfiles[5].id, assignee: maleStaff[2].id },
    { title: 'Water heater not working', desc: 'Geyser in Block B common bathroom stopped working. No hot water available for morning bathing.', cat: 'ELECTRICAL', pri: 'HIGH', status: 'IN_PROGRESS', hostel: hostelMale.id, student: maleProfiles[6].id, assignee: maleStaff[0].id },
    { title: 'Dustbin not replaced', desc: 'The dustbin in the corridor of floor 3, Aryabhatta Block has not been replaced for 4 days. Overflowing.', cat: 'CLEANING', pri: 'MEDIUM', status: 'CLOSED', hostel: hostelMale.id, student: maleProfiles[7].id, resolvedAt: new Date('2026-03-22') },
    { title: 'AC remote missing', desc: 'The AC remote for room G102 has been missing since last week. Cannot control temperature.', cat: 'FURNITURE', pri: 'LOW', status: 'OPEN', hostel: hostelFemale.id, student: femaleProfiles[0].id },
    { title: 'Shower head broken', desc: 'Shower head in attached bathroom of room G201 is cracked and water sprays in wrong direction.', cat: 'PLUMBING', pri: 'MEDIUM', status: 'ASSIGNED', hostel: hostelFemale.id, student: femaleProfiles[1].id, assignee: femaleStaff[0].id },
    { title: 'Power socket sparking', desc: 'The power socket near the study desk in room M103 sparks when plugging in charger. Very dangerous!', cat: 'ELECTRICAL', pri: 'URGENT', status: 'IN_PROGRESS', hostel: hostelFemale.id, student: femaleProfiles[2].id, assignee: femaleStaff[1].id },
    { title: 'Corridor light not working', desc: 'The corridor lights on floor 2 of Maitreyi Block are all off since yesterday night. Very dark.', cat: 'ELECTRICAL', pri: 'HIGH', status: 'RESOLVED', hostel: hostelFemale.id, student: femaleProfiles[3].id, assignee: femaleStaff[0].id, resolvedAt: new Date('2026-03-27') },
    { title: 'Door lock jammed', desc: 'The door lock of room G303 is jammed. Very difficult to lock from outside when going to class.', cat: 'MAINTENANCE', pri: 'MEDIUM', status: 'OPEN', hostel: hostelFemale.id, student: femaleProfiles[4].id },
    { title: 'Mosquito net torn', desc: 'Window mosquito net in room M201 has a big tear. Mosquitoes entering room at night.', cat: 'MAINTENANCE', pri: 'LOW', status: 'ASSIGNED', hostel: hostelFemale.id, student: femaleProfiles[5].id, assignee: femaleStaff[0].id },
    { title: 'Water purifier not filtering properly', desc: 'The RO water purifier on floor 1 Gargi Block has greenish tint. Tastes different.', cat: 'MAINTENANCE', pri: 'HIGH', status: 'OPEN', hostel: hostelFemale.id, student: femaleProfiles[6].id },
  ];

  for (const c of complaints) {
    const room = c.hostel === hostelMale.id ? randomPick(maleRooms) : randomPick(femaleRooms);
    await prisma.complaint.create({
      data: {
        title: c.title, description: c.desc, category: c.cat as any, priority: c.pri as any,
        status: c.status as any, studentId: c.student, hostelId: c.hostel,
        roomId: room.id, assignedToId: c.assignee, resolvedAt: c.resolvedAt,
        createdAt: randomDate(new Date('2026-03-10'), new Date('2026-03-28')),
      },
    });
  }

  // ═══════════════════════════════════════════
  // FEE RECORDS (multiple types, statuses)
  // ═══════════════════════════════════════════
  const feeTypes: Array<{ type: string; amount: number }> = [
    { type: 'HOSTEL_FEE', amount: 45000 },
    { type: 'MESS_FEE', amount: 18000 },
    { type: 'SECURITY_DEPOSIT', amount: 5000 },
    { type: 'MAINTENANCE_FEE', amount: 3000 },
  ];

  for (const sp of studentProfiles) {
    for (const ft of feeTypes) {
      const isPaid = Math.random() > 0.35;
      const isOverdue = !isPaid && Math.random() > 0.5;
      const isPartial = !isPaid && !isOverdue && Math.random() > 0.5;

      await prisma.feeRecord.create({
        data: {
          studentId: sp.id,
          hostelId: sp.hostelId,
          type: ft.type as any,
          amount: ft.amount,
          dueDate: new Date('2026-04-15'),
          status: isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : isPartial ? 'PARTIALLY_PAID' : 'PENDING',
          paidAmount: isPaid ? ft.amount : isPartial ? Math.floor(ft.amount * 0.5) : 0,
          paidDate: isPaid ? randomDate(new Date('2026-03-01'), new Date('2026-03-28')) : undefined,
          paymentMethod: isPaid ? randomPick(['UPI', 'BANK_TRANSFER', 'CARD'] as const) as any : undefined,
          transactionId: isPaid ? `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}` : undefined,
        },
      });
    }
  }

  // ═══════════════════════════════════════════
  // GATE PASSES (various statuses)
  // ═══════════════════════════════════════════
  const gatePasses = [
    { student: maleProfiles[0].id, hostel: hostelMale.id, type: 'HOME', reason: 'Going home for Holi festival celebration with family', dest: 'Bhopal, MP', status: 'RETURNED', exit: '2026-03-13T08:00:00Z', ret: '2026-03-16T20:00:00Z', actual: '2026-03-16T19:30:00Z', approver: wardenMale.id },
    { student: maleProfiles[1].id, hostel: hostelMale.id, type: 'MEDICAL', reason: 'Dental appointment at City Hospital', dest: 'City Hospital, Bhopal', status: 'APPROVED', exit: '2026-03-30T09:00:00Z', ret: '2026-03-30T14:00:00Z', approver: wardenMale.id },
    { student: maleProfiles[2].id, hostel: hostelMale.id, type: 'LOCAL', reason: 'Need to buy project components from Itwara electronics market', dest: 'Itwara Market, Bhopal', status: 'PENDING', exit: '2026-03-31T10:00:00Z', ret: '2026-03-31T16:00:00Z' },
    { student: maleProfiles[3].id, hostel: hostelMale.id, type: 'LOCAL', reason: 'Going to DB Mall for personal shopping', dest: 'DB City Mall, Bhopal', status: 'REJECTED', exit: '2026-03-28T18:00:00Z', ret: '2026-03-28T22:00:00Z', approver: wardenMale.id, remarks: 'Late evening outings not permitted on weekdays' },
    { student: maleProfiles[4].id, hostel: hostelMale.id, type: 'HOME', reason: 'Sister wedding function at hometown', dest: 'Jaipur, RJ', status: 'APPROVED', exit: '2026-04-02T06:00:00Z', ret: '2026-04-05T21:00:00Z', approver: wardenMale.id },
    { student: maleProfiles[5].id, hostel: hostelMale.id, type: 'EMERGENCY', reason: 'Father hospitalized, need to go urgently', dest: 'Pune, MH', status: 'CHECKED_OUT', exit: '2026-03-28T07:00:00Z', ret: '2026-03-31T20:00:00Z', approver: wardenMale.id },
    { student: femaleProfiles[0].id, hostel: hostelFemale.id, type: 'LOCAL', reason: 'Visit to Bharat Bhavan for cultural event', dest: 'Bharat Bhavan, Bhopal', status: 'RETURNED', exit: '2026-03-27T14:00:00Z', ret: '2026-03-27T19:00:00Z', actual: '2026-03-27T18:45:00Z', approver: wardenFemale.id },
    { student: femaleProfiles[1].id, hostel: hostelFemale.id, type: 'HOME', reason: 'Navratri puja at home', dest: 'Ahmedabad, GJ', status: 'PENDING', exit: '2026-04-01T07:00:00Z', ret: '2026-04-04T20:00:00Z' },
    { student: femaleProfiles[2].id, hostel: hostelFemale.id, type: 'MEDICAL', reason: 'Eye checkup at AIIMS', dest: 'AIIMS Bhopal', status: 'APPROVED', exit: '2026-03-31T08:30:00Z', ret: '2026-03-31T13:00:00Z', approver: wardenFemale.id },
  ];

  for (const gp of gatePasses) {
    await prisma.gatePass.create({
      data: {
        studentId: gp.student, hostelId: gp.hostel, type: gp.type as any,
        reason: gp.reason, destination: gp.dest, status: gp.status as any,
        exitDate: new Date(gp.exit), expectedReturn: new Date(gp.ret),
        actualReturn: gp.actual ? new Date(gp.actual) : undefined,
        approvedById: gp.approver, remarks: gp.remarks,
      },
    });
  }

  // ═══════════════════════════════════════════
  // VISITORS
  // ═══════════════════════════════════════════
  const visitors = [
    { name: 'Shri Mahesh Sharma', phone: '9826011001', purpose: 'Parent visit - meeting son Aarav', student: maleProfiles[0].id, hostel: hostelMale.id, idProof: 'Aadhar-XXXX-4521', logger: maleStaff[3].id, exit: true },
    { name: 'Smt. Sunita Patel', phone: '9826011002', purpose: 'Parent visit - bringing homemade food for Vihaan', student: maleProfiles[1].id, hostel: hostelMale.id, idProof: 'Aadhar-XXXX-7832', logger: maleStaff[3].id, exit: true },
    { name: 'Ravi Tiwari', phone: '9826055511', purpose: 'Plumber - called for bathroom repair', hostel: hostelMale.id, idProof: 'DL-MP09-2019-45632', logger: maleStaff[3].id, exit: true },
    { name: 'Delivery - Swiggy', phone: '9826099988', purpose: 'Food delivery for Room C202', student: maleProfiles[8].id, hostel: hostelMale.id, idProof: 'Swiggy-ID-78432', logger: maleStaff[3].id, exit: true },
    { name: 'Shri Kishore Desai', phone: '9826022002', purpose: 'Parent visit - meeting daughter Priya', student: femaleProfiles[1].id, hostel: hostelFemale.id, idProof: 'Aadhar-XXXX-9012', logger: femaleStaff[0].id, exit: true },
    { name: 'Dr. Anita Mathur', phone: '9826077711', purpose: 'Guest lecture coordination with warden', hostel: hostelFemale.id, idProof: 'PAN-ABCPM1234K', logger: femaleStaff[0].id, exit: false },
    { name: 'Smt. Krishnan Menon', phone: '9826022004', purpose: 'Parent visit - Kavya feeling unwell', student: femaleProfiles[3].id, hostel: hostelFemale.id, idProof: 'Aadhar-XXXX-3456', logger: femaleStaff[0].id, exit: false },
  ];

  for (const v of visitors) {
    const entryTime = randomDate(new Date('2026-03-27T08:00:00'), new Date('2026-03-29T16:00:00'));
    await prisma.visitor.create({
      data: {
        hostelId: v.hostel, visitorName: v.name, visitorPhone: v.phone,
        purpose: v.purpose, studentId: v.student, idProof: v.idProof,
        loggedById: v.logger, entryTime,
        exitTime: v.exit ? new Date(entryTime.getTime() + (30 + Math.random() * 150) * 60000) : undefined,
      },
    });
  }

  // ═══════════════════════════════════════════
  // MESS BOOKINGS (last 7 days for some students)
  // ═══════════════════════════════════════════
  const meals = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;
  for (let dayOffset = -7; dayOffset <= 3; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    for (const sp of studentProfiles.slice(0, 20)) {
      for (const meal of meals) {
        if (Math.random() > 0.25) {
          const pastDay = dayOffset < 0;
          await prisma.messBooking.create({
            data: {
              studentId: sp.id, hostelId: sp.hostelId, date, mealType: meal,
              isBooked: true,
              rating: pastDay && Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 3 : undefined,
              feedback: pastDay && Math.random() > 0.8 ? randomPick(['Good food today', 'Dal was too salty', 'Loved the biryani!', 'Chapati was hard', 'Excellent paneer dish']) : undefined,
            },
          });
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════
  const allUserIds = studentProfiles.map((s) => s.userId);
  const notifTemplates = [
    { title: 'Fee Payment Reminder', message: 'Your hostel fee of Rs. 45,000 is due by April 15, 2026. Please pay before the deadline to avoid late fee.', type: 'WARNING' },
    { title: 'Mess Menu Updated', message: 'This week\'s mess menu has been updated. Check the mess section for details.', type: 'INFO' },
    { title: 'Hostel Day Celebration', message: 'Annual Hostel Day celebrations on April 10th! Cultural events, games, and dinner party. Register now.', type: 'ANNOUNCEMENT' },
    { title: 'Water Supply Interruption', message: 'Water supply will be interrupted on March 30th from 10 AM to 2 PM due to tank cleaning.', type: 'WARNING' },
    { title: 'Library Hours Extended', message: 'Hostel library will remain open till 12 AM during exam weeks (April 1-15).', type: 'INFO' },
    { title: 'Complaint Resolved', message: 'Your complaint regarding WiFi connectivity has been resolved. Please verify and close the ticket.', type: 'SUCCESS' },
  ];

  for (const uid of allUserIds.slice(0, 15)) {
    for (const notif of notifTemplates.slice(0, 2 + Math.floor(Math.random() * 4))) {
      await prisma.notification.create({
        data: {
          userId: uid, title: notif.title, message: notif.message,
          type: notif.type as any, isRead: Math.random() > 0.5,
          createdAt: randomDate(new Date('2026-03-20'), new Date('2026-03-29')),
        },
      });
    }
  }

  // ═══════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════
  const events = [
    { title: 'Annual Hostel Day - Utsav 2026', desc: 'Join us for the grand annual hostel day celebration with cultural programs, music night, comedy show, and dinner.', venue: 'Hostel Amphitheatre', cat: 'CULTURAL', capacity: 200, date: '2026-04-10T17:00:00Z', end: '2026-04-10T23:00:00Z' },
    { title: 'Cricket Tournament - Hostel Premier League', desc: 'Inter-block cricket tournament. Form your teams (6 players each). Prizes for top 3 teams.', venue: 'Campus Cricket Ground', cat: 'SPORTS', capacity: 60, date: '2026-04-05T06:00:00Z', end: '2026-04-05T18:00:00Z' },
    { title: 'Workshop: Resume Building & Interview Prep', desc: 'Career development workshop by Prof. Sharma. Bring your laptops. Mock interviews included.', venue: 'Hostel Common Room', cat: 'ACADEMIC', capacity: 40, date: '2026-04-03T14:00:00Z', end: '2026-04-03T17:00:00Z' },
    { title: 'Ram Navami Pooja & Bhajan Sandhya', desc: 'Ram Navami celebrations with morning pooja, bhajan sandhya, and prasad distribution.', venue: 'Hostel Prayer Hall', cat: 'FESTIVAL', capacity: 100, date: '2026-04-06T06:00:00Z', end: '2026-04-06T12:00:00Z' },
    { title: 'Monthly Hostel Committee Meeting', desc: 'Open meeting for all hostel residents. Discuss mess quality, maintenance issues, and upcoming events.', venue: 'Conference Room, Admin Block', cat: 'MEETING', capacity: 30, date: '2026-04-01T18:00:00Z', end: '2026-04-01T19:30:00Z' },
    { title: 'Movie Night: Lagaan', desc: 'Outdoor movie screening on the hostel lawn. Popcorn and cold drinks provided!', venue: 'Hostel Lawn', cat: 'CULTURAL', capacity: 150, date: '2026-04-08T19:30:00Z', end: '2026-04-08T23:00:00Z' },
  ];

  for (const ev of events) {
    const event = await prisma.event.create({
      data: {
        title: ev.title, description: ev.desc, venue: ev.venue,
        category: ev.cat as any, capacity: ev.capacity,
        date: new Date(ev.date), endDate: ev.end ? new Date(ev.end) : undefined,
        hostelId: hostelMale.id, createdById: adminMale.id,
      },
    });

    // Add RSVPs
    const rsvpCount = Math.min(ev.capacity || 20, 10 + Math.floor(Math.random() * 15));
    const rsvpUsers = [...allUserIds].sort(() => Math.random() - 0.5).slice(0, rsvpCount);
    for (const uid of rsvpUsers) {
      await prisma.eventRsvp.create({
        data: {
          eventId: event.id, userId: uid,
          status: randomPick(['GOING', 'GOING', 'GOING', 'MAYBE', 'NOT_GOING'] as const) as any,
        },
      });
    }
  }

  // ═══════════════════════════════════════════
  // ATTENDANCE (last 5 days)
  // ═══════════════════════════════════════════
  for (let dayOffset = -5; dayOffset <= -1; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    for (const sp of studentProfiles.slice(0, 30)) {
      const staffForHostel = sp.hostelId === hostelMale.id ? maleStaff : femaleStaff;
      const status = Math.random() > 0.15 ? 'PRESENT' : Math.random() > 0.5 ? 'LATE' : 'ABSENT';
      const checkInHour = status === 'LATE' ? 23 + Math.floor(Math.random() * 2) : 21 + Math.floor(Math.random() * 2);

      await prisma.attendance.create({
        data: {
          studentId: sp.id, hostelId: sp.hostelId, date,
          status: status as any, method: 'MANUAL',
          markedById: randomPick(staffForHostel).id,
          checkIn: status !== 'ABSENT' ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), checkInHour, Math.floor(Math.random() * 60)) : undefined,
        },
      });
    }
  }

  // ═══════════════════════════════════════════
  // LOGIN HISTORY
  // ═══════════════════════════════════════════
  const loginUsers = [adminMale.id, wardenMale.id, ...maleStaff.slice(0, 2).map((s) => s.id), ...allUserIds.slice(0, 8)];
  for (const uid of loginUsers) {
    for (let i = 0; i < 3 + Math.floor(Math.random() * 5); i++) {
      await prisma.loginHistory.create({
        data: {
          userId: uid,
          ipAddress: `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 255)}`,
          userAgent: randomPick([
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0',
            'Mozilla/5.0 (Linux; Android 14) Chrome/123.0 Mobile',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) Safari/605.1',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) Safari/17.4',
          ]),
          createdAt: randomDate(new Date('2026-03-20'), new Date('2026-03-29')),
        },
      });
    }
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║           LOGIN CREDENTIALS                 ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║ Super Admin: dean@campusphere.edu / admin123');
  console.log('║ Admin (M):   admin@campusphere.edu / admin123');
  console.log('║ Admin (F):   admin.girls@campusphere.edu / admin123');
  console.log('║ Warden (M):  warden@campusphere.edu / warden123');
  console.log('║ Warden (F):  warden.girls@campusphere.edu / warden123');
  console.log('║ Staff:       ramesh.yadav@campusphere.edu / staff123');
  console.log('║ Student (M): cs2024001@student.edu / student123');
  console.log('║ Student (F): cs2024f01@student.edu / student123');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\nSeeded: 2 hostels, 5 blocks, ${allRooms.length} rooms, ${allBeds.length} beds`);
  console.log(`Students: ${maleStudents.length} male + ${femaleStudents.length} female = ${maleStudents.length + femaleStudents.length}`);
  console.log(`Staff: ${staffData.length} | Complaints: ${complaints.length} | Gate Passes: ${gatePasses.length}`);
  console.log(`Events: ${events.length} | Visitors: ${visitors.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
