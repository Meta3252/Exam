const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// อ่านไฟล์ ca.pem แบบ absolute path
const sslCaPath = path.resolve(__dirname, 'certs', 'ca.pem');

let sslCa;
try {
  sslCa = fs.readFileSync(sslCaPath);
  console.log('✅ อ่านไฟล์ SSL CA สำเร็จ:', sslCaPath);
} catch (err) {
  console.error('❌ อ่านไฟล์ SSL CA ไม่สำเร็จ:', sslCaPath, err);
  process.exit(1); // หยุดโปรแกรมถ้าไม่เจอไฟล์
}

const connection = mysql.createConnection({
  host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
  port: 4000,
  user: "4EyRHb9LHnGM8dx.root",
  password: "hVMm5a9kyovoyJbP",
  database: "test",
  ssl: {
    ca: sslCa,
  },
});

connection.connect((err) => {
  if (err) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูล:', err);
  } else {
    console.log('✅ เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
  }
});

app.post('/api/tasks', (req, res) => {
  const { type, name, startTime, endTime, status, createdAt, updatedAt } = req.body;

  const sql = `INSERT INTO tasks (type, name, startTime, endTime, status, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  connection.query(sql, [type, name, startTime, endTime, status, createdAt, updatedAt], (err, result) => {
    if (err) {
      console.error('❌ เกิดข้อผิดพลาดในการบันทึก:', err);
      res.status(500).json({ message: 'บันทึกข้อมูลไม่สำเร็จ' });
    } else {
      res.status(200).json({ message: '✅ บันทึกข้อมูลเรียบร้อยแล้ว' });
    }
  });
});

app.get('/api/tasks', (req, res) => {
  const { startDate, endDate } = req.query;

  let sql = `SELECT * FROM tasks`;
  const params = [];

  if (startDate && endDate) {
    sql += ` WHERE DATE(startTime) BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error('❌ ดึงข้อมูลไม่สำเร็จ:', err);
      return res.status(500).json({ message: 'ดึงข้อมูลไม่สำเร็จ' });
    }
    res.json(results);
  });
});

app.put('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const { type, name, startTime, endTime, status, updatedAt } = req.body;

  const sql = `
    UPDATE tasks 
    SET type = ?, name = ?, startTime = ?, endTime = ?, status = ?, updatedAt = ?
    WHERE id = ?
  `;

  connection.query(
    sql,
    [type, name, startTime, endTime, status, updatedAt, taskId],
    (err, result) => {
      if (err) {
        console.error('❌ เกิดข้อผิดพลาดในการแก้ไขข้อมูล:', err);
        return res.status(500).json({ message: 'แก้ไขข้อมูลไม่สำเร็จ' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลที่จะแก้ไข' });
      }

      res.json({ message: '✅ แก้ไขข้อมูลเรียบร้อยแล้ว' });
    }
  );
});

app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;

  const sql = `DELETE FROM tasks WHERE id = ?`;

  connection.query(sql, [taskId], (err, result) => {
    if (err) {
      console.error('❌ เกิดข้อผิดพลาดในการลบข้อมูล:', err);
      return res.status(500).json({ message: 'ลบข้อมูลไม่สำเร็จ' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลที่จะแก้ไข' });
    }

    res.json({ message: '✅ ลบข้อมูลเรียบร้อยแล้ว' });
  });
});

app.get('/api/report/daily', (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'กรุณาระบุ startDate และ endDate' });
  }

  const sql = `
    SELECT * FROM tasks
    WHERE DATE(startTime) BETWEEN ? AND ?
    ORDER BY startTime ASC
  `;

  connection.query(sql, [startDate, endDate], (err, results) => {
    if (err) {
      console.error('❌ ดึงรายงานประจำวันไม่สำเร็จ:', err);
      return res.status(500).json({ message: 'ดึงรายงานประจำวันไม่สำเร็จ' });
    }

    res.json(results);
  });
});

app.get('/api/report/monthly-status', (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: 'กรุณาระบุ month และ year' });
  }

  const sql = `
    SELECT status, COUNT(*) AS count
    FROM tasks
    WHERE MONTH(startTime) = ? AND YEAR(startTime) = ?
    GROUP BY status
  `;

  connection.query(sql, [month, year], (err, results) => {
    if (err) {
      console.error('❌ ดึงรายงานสถานะตามเดือนไม่สำเร็จ:', err);
      return res.status(500).json({ message: 'ดึงรายงานสถานะตามเดือนไม่สำเร็จ' });
    }

    res.json(results);
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend รันที่ http://localhost:${PORT}`);
});
