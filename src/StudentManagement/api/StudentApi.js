const API_BASE = "http://localhost:5000"; // <-- change to your backend origin

// Fetch all students with optional section filter
export const fetchStudents = async (course, semester, section) => {
  try {
    const res = await fetch(`${API_BASE}/students`);
    if (!res.ok) {
      const m = await res.json().catch(() => ({}));
      throw new Error(m.message || `HTTP ${res.status}`);
    }
    const data = await res.json();

    // Map backend -> UI shape expected by components
    const mapped = (data || []).map(s => ({
      id: s._id, // keep .id for components
      name: s.fullName,
      rollNo: s.rollNumber,
      section: s.section,
      specialization: Array.isArray(s.specializations)
        ? s.specializations
        : (s.specializations ? [s.specializations] : []),
      mobile: s.phoneNumber,
      email: s.email,
      // keep original so we can send back on save if needed
      _raw: s
    }));

    // Optional simple filter by section
    const filtered = section ? mapped.filter(s => s.section === section) : mapped;
    return filtered;
  } catch (err) {
    console.error("Failed to fetch students:", err);
    throw err;
  }
};

// Update a student
export const updateStudent = async (studentId, updatedStudent) => {
  try {
    const payload = {
      fullName: updatedStudent.name,
      rollNumber: updatedStudent.rollNo,
      section: updatedStudent.section,
      email: updatedStudent.email,
      phoneNumber: updatedStudent.mobile,
      specializations: (updatedStudent.specialization || []).filter(Boolean),
    };

    const res = await fetch(`${API_BASE}/students/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const m = await res.json().catch(() => ({}));
      throw new Error(m.message || `Update failed (HTTP ${res.status})`);
    }

    return await res.json();
  } catch (err) {
    console.error("Failed to update student:", err);
    throw err;
  }
};

// Delete a student
export const deleteStudent = async (studentId) => {
  try {
    const res = await fetch(`${API_BASE}/students/${studentId}`, { 
      method: "DELETE" 
    });
    
    if (!res.ok) {
      const m = await res.json().catch(() => ({}));
      throw new Error(m.message || `Delete failed (HTTP ${res.status})`);
    }
    
    return true;
  } catch (err) {
    console.error("Failed to delete student:", err);
    throw err;
  }
};