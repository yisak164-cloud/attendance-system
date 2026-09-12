import { useState, useEffect } from 'react'
import api from '../api.js'
import Header from '../components/Header.jsx'

function AdminDashboard() {
  // which tab is open
  const [tab, setTab] = useState('users')

  // lists loaded from the backend
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [assignments, setAssignments] = useState([])
  const [requests, setRequests] = useState([])
  const [teacherAttendance, setTeacherAttendance] = useState([])
  const [attendance, setAttendance] = useState([])

  // form fields
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'student' })
  const [newCourse, setNewCourse] = useState({ course: '', classType: 'regular' })
  const [newEnrollment, setNewEnrollment] = useState({ studentId: '', courseId: '' })
  const [newAssignment, setNewAssignment] = useState({ teacherId: '', courseId: '' })
  const [newTeacherAtt, setNewTeacherAtt] = useState({ teacherId: '', courseId: '', date: '', status: 'present' })

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [attCourseId, setAttCourseId] = useState('')
const [attDate, setAttDate] = useState('')

const [enrollCourseId, setEnrollCourseId] = useState('')

async function loadEnrollmentsView() {
  setError('')
  try {
    const res = await api.get('/enrollments?courseId=' + enrollCourseId)
    setEnrollments(res.data.enrollments)
  } catch (err) {
    setError(err.response?.data?.message || 'Something went wrong')
  }
}

useEffect(() => {
  if (enrollCourseId) {
    loadEnrollmentsView()
  } else {
    setEnrollments([])
  }
}, [enrollCourseId])

async function loadAttendanceView() {
  setError('')
  try {
    let url = '/attendance/all?courseId=' + attCourseId
    if (attDate) url += '&date=' + attDate
    const res = await api.get(url)
    setAttendance(res.data.attendance)
  } catch (err) {
    setError(err.response?.data?.message || 'Something went wrong')
  }
}

useEffect(() => {
  if (attCourseId) {
    loadAttendanceView()
  } else {
    setAttendance([])
  }
}, [attCourseId, attDate])

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      setUsers((await api.get('/auth/users')).data.users)
      setCourses((await api.get('/courses')).data.courses)
     setAssignments((await api.get('/teaching')).data.assignments)
      setRequests((await api.get('/correction-requests')).data.correctionRequests)
      setTeacherAttendance((await api.get('/teacher-attendance')).data.attendance)
      
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  // One helper for every form, so we do not repeat try/catch everywhere.
  async function send(path, body, successText) {
    setError('')
    setMessage('')

    try {
      await api.post(path, body)
      setMessage(successText)
      loadAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  
  // Promote or demote an existing user
  async function changeRole(userId, newRole) {
    setError('')
    setMessage('')

    try {
      const res = await api.patch('/auth/users/' + userId + '/role', { role: newRole })
      setMessage(res.data.message)
      loadAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  async function removeAssignment(assignmentId) {
    setError('')
    setMessage('')

    try {
      await api.delete('/teaching/' + assignmentId)
      setMessage('Teacher removed from course.')
      loadAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  // small helpers to filter the user list
  const students = users.filter((user) => user.role === 'student')
  const teachers = users.filter((user) => user.role === 'teacher')

  const tabs = [
    ['users', 'Users'],
    ['courses', 'Courses'],
    ['enrollments', 'Enrollments'],
    ['teaching', 'Teaching'],
    ['corrections', 'Corrections'],
    ['teacherAtt', 'Teacher Attendance'],
    ['attendance', 'Student Attendance Records']
  ]

  return (
    <div>
      <Header title="Admin Dashboard" role="admin" />

      <div className="content">
        <div className="tabs">
          {tabs.map((item) => (
            <button
              key={item[0]}
              className={tab === item[0] ? 'tab active' : 'tab'}
              onClick={() => setTab(item[0])}
            >
              {item[1]}
            </button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        {/* ---------------- USERS ---------------- */}
        {tab === 'users' && (
          <div>
            <div className="card">
              <h3>Create a user</h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send('/auth/users', newUser, 'User created.')
                  setNewUser({ fullName: '', email: '', password: '', role: 'student' })
                }}
              >
                <div className="row">
                  <div className="field">
                    <label>Full name</label>
                    <input
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Password</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-main">Create</button>
              </form>
            </div>

            <div className="card">
              <h3>All users ({users.length})</h3>

              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Change role</th></tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td><span className={'role ' + user.role}>{user.role}</span></td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user._id, e.target.value)}
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- COURSES ---------------- */}
        {tab === 'courses' && (
          <div>
            <div className="card">
              <h3>Create a course</h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send('/courses', newCourse, 'Course created.')
                  setNewCourse({ course: '', classType: 'regular' })
                }}
              >
                <div className="row">
                  <div className="field">
                    <label>Course name</label>
                    <input
                      value={newCourse.course}
                      onChange={(e) => setNewCourse({ ...newCourse, course: e.target.value })}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Class type</label>
                    <select
                      value={newCourse.classType}
                      onChange={(e) => setNewCourse({ ...newCourse, classType: e.target.value })}
                    >
                      <option value="regular">Regular</option>
                      <option value="weekend">Weekend</option>
                      <option value="extension">Extension</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-main">Create</button>
              </form>
            </div>

            <div className="card">
              <h3>All courses ({courses.length})</h3>

              <table>
                <thead>
                  <tr><th>Course</th><th>Type</th></tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course._id}>
                      <td>{course.course}</td>
                      <td>{course.classType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- ENROLLMENTS ---------------- */}
        {tab === 'enrollments' && (
         <div className="card">
  <h3>Students enrolled in a course</h3>

  <div className="field">
    <label>Course</label>
    <select value={enrollCourseId} onChange={(e) => setEnrollCourseId(e.target.value)}>
      <option value="">-- select a course --</option>
      {courses.map((course) => (
        <option key={course._id} value={course._id}>
          {course.course} ({course.classType})
        </option>
      ))}
    </select>
  </div>

  {enrollCourseId && enrollments.length === 0 && <p className="empty">No students enrolled yet.</p>}

  {enrollments.length > 0 && (
    <table>
      <thead>
        <tr><th>Student</th><th>Course</th><th>Type</th></tr>
      </thead>
      <tbody>
        {enrollments.map((enrollment) => (
          <tr key={enrollment._id}>
            <td>{enrollment.student ? enrollment.student.fullName : '-'}</td>
            <td>{enrollment.course ? enrollment.course.course : '-'}</td>
            <td>{enrollment.course ? enrollment.course.classType : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>
        )}

        {/* ---------------- TEACHING ---------------- */}
        {tab === 'teaching' && (
          <div>
            <div className="card">
              <h3>Assign a teacher to a course</h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send('/teaching', newAssignment, 'Teacher assigned.')
                }}
              >
                <div className="row">
                  <div className="field">
                    <label>Teacher</label>
                    <select
                      value={newAssignment.teacherId}
                      onChange={(e) => setNewAssignment({ ...newAssignment, teacherId: e.target.value })}
                      required
                    >
                      <option value="">-- select --</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>{teacher.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Course</label>
                    <select
                      value={newAssignment.courseId}
                      onChange={(e) => setNewAssignment({ ...newAssignment, courseId: e.target.value })}
                      required
                    >
                      <option value="">-- select --</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>{course.course} ({course.classType})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-main">Assign</button>
              </form>
            </div>

            <div className="card">
              <h3>All assignments ({assignments.length})</h3>

              <table>
                <thead>
                  <tr><th>Teacher</th><th>Course</th><th></th></tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment._id}>
                      <td>{assignment.teacher ? assignment.teacher.fullName : '-'}</td>
                      <td>{assignment.course ? assignment.course.course : '-'}</td>
                      <td>
                        <button
                          className="btn-danger"
                          onClick={() => removeAssignment(assignment._id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- CORRECTIONS ---------------- */}
       {tab === 'corrections' && (
  <div className="card">
    <h3>Correction requests ({requests.length})</h3>
    <p className="subtitle">
      Viewing for oversight — approvals are handled by the recording teacher.
    </p>

    {requests.length === 0 && <p className="empty">No requests yet.</p>}

    {requests.length > 0 && (
      <table>
        <thead>
          <tr>
            <th>Student</th><th>Teacher</th><th>Course</th><th>Asked for</th>
            <th>Reason</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request._id}>
              <td>{request.student ? request.student.fullName : '-'}</td>
              <td>
                {request.attendance && request.attendance.recordedBy
                  ? request.attendance.recordedBy.fullName
                  : '-'}
              </td>
              <td>
                {request.attendance && request.attendance.course
                  ? request.attendance.course.course
                  : '-'}
              </td>
              <td>{request.requestedStatus}</td>
              <td>{request.reason}</td>
              <td><span className={'status ' + request.status}>{request.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
        {/* ---------------- TEACHER ATTENDANCE ---------------- */}
        {tab === 'teacherAtt' && (
          <div>
            <div className="card">
              <h3>Record teacher attendance</h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send('/teacher-attendance', newTeacherAtt, 'Teacher attendance saved.')
                }}
              >
                <div className="row">
                  <div className="field">
                    <label>Teacher</label>
                    <select
                      value={newTeacherAtt.teacherId}
                      onChange={(e) => setNewTeacherAtt({ ...newTeacherAtt, teacherId: e.target.value })}
                      required
                    >
                      <option value="">-- select --</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>{teacher.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Course</label>
                    <select
                      value={newTeacherAtt.courseId}
                      onChange={(e) => setNewTeacherAtt({ ...newTeacherAtt, courseId: e.target.value })}
                      required
                    >
                      <option value="">-- select --</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>{course.course} ({course.classType})</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Date</label>
                    <input
                      type="date"
                      value={newTeacherAtt.date}
                      onChange={(e) => setNewTeacherAtt({ ...newTeacherAtt, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Status</label>
                    <select
                      value={newTeacherAtt.status}
                      onChange={(e) => setNewTeacherAtt({ ...newTeacherAtt, status: e.target.value })}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-main">Save</button>
              </form>
            </div>

            <div className="card">
              <h3>Teacher attendance records ({teacherAttendance.length})</h3>

              <table>
                <thead>
                  <tr><th>Teacher</th><th>Course</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {teacherAttendance.map((record) => (
                    <tr key={record._id}>
                      <td>{record.teacher ? record.teacher.fullName : '-'}</td>
                      <td>{record.course ? record.course.course : '-'}</td>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td><span className={'status ' + record.status}>{record.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- STUDENT ATTENDANCE ---------------- */}
        {tab === 'attendance' && (
  <div className="card">
    <h3>All student attendance</h3>

    <div className="field">
      <label>Course</label>
      <select value={attCourseId} onChange={(e) => setAttCourseId(e.target.value)}>
        <option value="">-- select a course --</option>
        {courses.map((course) => (
          <option key={course._id} value={course._id}>
            {course.course} ({course.classType})
          </option>
        ))}
      </select>
    </div>

    {attCourseId && (
      <div className="field">
        <label>Date (optional)</label>
        <input
          type="date"
          value={attDate}
          onChange={(e) => setAttDate(e.target.value)}
        />
      </div>
    )}

    {attCourseId && attendance.length === 0 && <p className="empty">Nothing recorded yet.</p>}

    {attendance.length > 0 && (
      <table>
        <thead>
          <tr>
            <th>Student</th><th>Course</th><th>Date</th>
            <th>Status</th><th>Recorded by</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((record) => (
            <tr key={record._id}>
              <td>{record.student ? record.student.fullName : '-'}</td>
              <td>{record.course ? record.course.course : '-'}</td>
              <td>{new Date(record.date).toLocaleDateString()}</td>
              <td><span className={'status ' + record.status}>{record.status}</span></td>
              <td>{record.recordedBy ? record.recordedBy.fullName : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
      </div>
    </div>
  )
}

export default AdminDashboard
