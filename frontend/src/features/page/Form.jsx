import React, { useState, useEffect } from 'react';

function Form() {
  const [form, setForm] = useState({
    id: null,
    type: '',
    name: '',
    startTime: '',
    endTime: '',
    status: '',
    createdAt: '',
    updatedAt: '',
  });

  const [tasks, setTasks] = useState([]);
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [reportMonth, setReportMonth] = useState('');
  const [reportYear, setReportYear] = useState('');
  const [monthlyStatusReport, setMonthlyStatusReport] = useState([]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const convertToMySQLDateTime = (datetimeLocal) => {
    if (!datetimeLocal) return null;
    return datetimeLocal.replace('T', ' ') + ':00';
  };

  const fetchTasks = async (startDate, endDate) => {
    try {
      let url = 'http://localhost:5000/api/tasks';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('ไม่สามารถดึงข้อมูลได้');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.startTime || !form.endTime) {
      alert('กรุณาระบุเวลาเริ่มและเวลาสิ้นสุด');
      return;
    }
    if (form.endTime < form.startTime) {
      alert('เวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่ม');
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const dataToSend = {
      ...form,
      startTime: convertToMySQLDateTime(form.startTime),
      endTime: convertToMySQLDateTime(form.endTime),
      updatedAt: now,
    };

    if (!isEditing) {
      dataToSend.createdAt = now;
    }

    try {
      let response;
      if (isEditing && form.id) {
        response = await fetch(`http://localhost:5000/api/tasks/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
      } else {
        response = await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
      }

      const result = await response.json();

      if (response.ok) {
        alert(isEditing ? 'แก้ไขข้อมูลเรียบร้อย' : 'ข้อมูลถูกบันทึกเรียบร้อย');
        fetchTasks();
        clearForm();
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  const clearForm = () => {
    setForm({
      id: null,
      type: '',
      name: '',
      startTime: '',
      endTime: '',
      status: '',
      createdAt: '',
      updatedAt: '',
    });
    setIsEditing(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบข้อมูลนี้หรือไม่?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('ลบข้อมูลเรียบร้อย');
        fetchTasks();
      } else {
        alert('ลบข้อมูลไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleEdit = (task) => {
    setForm({
      id: task.id,
      type: task.type,
      name: task.name,
      startTime: task.startTime ? task.startTime.slice(0, 16).replace(' ', 'T') : '',
      endTime: task.endTime ? task.endTime.slice(0, 16).replace(' ', 'T') : '',
      status: task.status,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
    setIsEditing(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchStart || !searchEnd) {
      alert('กรุณาเลือกช่วงวันที่ค้นหา');
      return;
    }
    if (searchEnd < searchStart) {
      alert('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น');
      return;
    }
    fetchTasks(searchStart, searchEnd);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const fetchMonthlyStatusReport = async () => {
    if (!reportMonth || !reportYear) {
      alert('กรุณาเลือกเดือนและปีสำหรับรายงาน');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/report/monthly-status?month=${reportMonth}&year=${reportYear}`);
      const data = await res.json();
      setMonthlyStatusReport(data);
    } catch (error) {
      console.error('Error fetching monthly status report:', error);
      alert('ไม่สามารถดึงรายงานสถานะตามเดือนได้');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h2>แบบฟอร์มบันทึกข้อมูล</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>ประเภท: </label>
          <select name="type" value={form.type} onChange={handleChange} required>
            <option value="">-- เลือกประเภท --</option>
            <option value="Computer">Computer</option>
            <option value="Computer repair">Computer repair</option>
            <option value="Network">Network</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>ชื่อเรื่อง: </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>เวลาเริ่มต้น: </label>
          <input
            type="datetime-local"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>เวลาสิ้นสุด: </label>
          <input
            type="datetime-local"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>สถานะ: </label>
          <select name="status" value={form.status} onChange={handleChange} required>
            <option value="">-- เลือกสถานะ --</option>
            <option value="ดำเนินการ">ดำเนินการ</option>
            <option value="เสร็จสิ้น">เสร็จสิ้น</option>
            <option value="ยกเลิก">ยกเลิก</option>
          </select>
        </div>

        <button type="submit">{isEditing ? 'แก้ไขข้อมูล' : 'บันทึกข้อมูล'}</button>
        {isEditing && <button type="button" onClick={clearForm} style={{ marginLeft: '1rem' }}>ยกเลิก</button>}
      </form>

      <hr />

      <h3>ค้นหาข้อมูลตามช่วงวันที่</h3>
      <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
        <label>วันที่เริ่มต้น: </label>
        <input
          type="date"
          value={searchStart}
          onChange={e => setSearchStart(e.target.value)}
          required
        />
        <label style={{ marginLeft: '1rem' }}>วันที่สิ้นสุด: </label>
        <input
          type="date"
          value={searchEnd}
          onChange={e => setSearchEnd(e.target.value)}
          required
        />
        <button type="submit" style={{ marginLeft: '1rem' }}>ค้นหา</button>
      </form>

      <table
        border="1"
        cellPadding="5"
        cellSpacing="0"
        style={{ width: '100%', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            <th>ประเภท</th>
            <th>ชื่อเรื่อง</th>
            <th>เวลาเริ่มต้น</th>
            <th>เวลาสิ้นสุด</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>ไม่พบข้อมูล</td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.type}</td>
                <td>{task.name}</td>
                <td>{formatDateTime(task.startTime)}</td>
                <td>{formatDateTime(task.endTime)}</td>
                <td>{task.status}</td>
                <td>
                  <button onClick={() => handleEdit(task)}>แก้ไข</button>
                  <button onClick={() => handleDelete(task.id)} style={{ marginLeft: '0.5rem' }}>ลบ</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <hr style={{ margin: '2rem 0' }} />

      <h3>รายงานสรุปจำนวนสถานะการทำงานรายเดือน</h3>
      <div style={{ marginBottom: '1rem' }}>
        <label>เลือกเดือน: </label>
        <select value={reportMonth} onChange={e => setReportMonth(e.target.value)}>
          <option value="">-- เลือกเดือน --</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>

        <label style={{ marginLeft: '1rem' }}>เลือกปี: </label>
        <input
          type="number"
          min="2000"
          max="2100"
          placeholder="ปี (เช่น 2025)"
          value={reportYear}
          onChange={e => setReportYear(e.target.value)}
          style={{ width: '100px' }}
        />

        <button onClick={fetchMonthlyStatusReport} style={{ marginLeft: '1rem' }}>ดูรายงาน</button>
      </div>

      <table
        border="1"
        cellPadding="5"
        cellSpacing="0"
        style={{ width: '100%', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            <th>สถานะ</th>
            <th>จำนวนงาน</th>
          </tr>
        </thead>
        <tbody>
          {monthlyStatusReport.length === 0 ? (
            <tr>
              <td colSpan="2" style={{ textAlign: 'center' }}>ไม่พบข้อมูล</td>
            </tr>
          ) : (
            monthlyStatusReport.map((item) => (
              <tr key={item.status}>
                <td>{item.status}</td>
                <td>{item.count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Form;
