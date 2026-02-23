// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/login';
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API Error');
      }

      return data;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  // Auth APIs
  async register(email, password, full_name, role = 'student', school_id = null) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, role, school_id }),
    });
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Users APIs
  async getUsers() {
    return this.request('/users');
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  async getUsersByRole(role) {
    return this.request(`/users/role/${role}`);
  }

  // Schools APIs
  async getSchools() {
    return this.request('/schools');
  }

  async getSchool(id) {
    return this.request(`/schools/${id}`);
  }

  async createSchool(data) {
    return this.request('/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSchool(id, data) {
    return this.request(`/schools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSchool(id) {
    return this.request(`/schools/${id}`, { method: 'DELETE' });
  }

  // Classes APIs
  async getClasses() {
    return this.request('/classes');
  }

  async getClass(id) {
    return this.request(`/classes/${id}`);
  }

  async createClass(data) {
    return this.request('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClass(id, data) {
    return this.request(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClass(id) {
    return this.request(`/classes/${id}`, { method: 'DELETE' });
  }

  // Exams APIs
  async getExams() {
    return this.request('/exams');
  }

  async getExam(id) {
    return this.request(`/exams/${id}`);
  }

  async createExam(data) {
    return this.request('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExam(id, data) {
    return this.request(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExam(id) {
    return this.request(`/exams/${id}`, { method: 'DELETE' });
  }

  // Subjects APIs
  async getSubjects() {
    return this.request('/subjects');
  }

  async getSubject(id) {
    return this.request(`/subjects/${id}`);
  }

  async createSubject(data) {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubject(id, data) {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id) {
    return this.request(`/subjects/${id}`, { method: 'DELETE' });
  }

  async getSubjectsByClass(classId) {
    return this.request(`/subjects/class/${classId}`);
  }

  // Chapters APIs
  async getChapters() {
    return this.request('/chapters');
  }

  async getChapter(id) {
    return this.request(`/chapters/${id}`);
  }

  async createChapter(data) {
    return this.request('/chapters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateChapter(id, data) {
    return this.request(`/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteChapter(id) {
    return this.request(`/chapters/${id}`, { method: 'DELETE' });
  }

  async getChaptersBySubject(subjectId) {
    return this.request(`/chapters/subject/${subjectId}`);
  }

  // Materials APIs
  async getMaterials() {
    return this.request('/materials');
  }

  async getMaterial(id) {
    return this.request(`/materials/${id}`);
  }

  async createMaterial(data) {
    return this.request('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMaterial(id, data) {
    return this.request(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMaterial(id) {
    return this.request(`/materials/${id}`, { method: 'DELETE' });
  }

  async getMaterialsByChapter(chapterId) {
    return this.request(`/materials/chapter/${chapterId}`);
  }

  async getMaterialsByType(type) {
    return this.request(`/materials/type/${type}`);
  }

  async downloadMaterial(id) {
    return this.request(`/materials/${id}/download`, { method: 'POST' });
  }

  // Quizzes APIs
  async getQuizzes() {
    return this.request('/quizzes');
  }

  async getQuiz(id) {
    return this.request(`/quizzes/${id}`);
  }

  async createQuiz(data) {
    return this.request('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuiz(id, data) {
    return this.request(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuiz(id) {
    return this.request(`/quizzes/${id}`, { method: 'DELETE' });
  }

  async getQuizzesByChapter(chapterId) {
    return this.request(`/quizzes/chapter/${chapterId}`);
  }

  async addQuizQuestion(quizId, data) {
    return this.request(`/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteQuizQuestion(quizId, questionIndex) {
    return this.request(`/quizzes/${quizId}/questions/${questionIndex}`, { method: 'DELETE' });
  }

  // Assignments APIs
  async getAssignments() {
    return this.request('/assignments');
  }

  async getAssignment(id) {
    return this.request(`/assignments/${id}`);
  }

  async createAssignment(data) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssignment(id, data) {
    return this.request(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id) {
    return this.request(`/assignments/${id}`, { method: 'DELETE' });
  }

  async getAssignmentsByChapter(chapterId) {
    return this.request(`/assignments/chapter/${chapterId}`);
  }

  async submitAssignment(assignmentId, data) {
    return this.request(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async gradeAssignment(assignmentId, studentId, data) {
    return this.request(`/assignments/${assignmentId}/grade/${studentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new APIClient();
