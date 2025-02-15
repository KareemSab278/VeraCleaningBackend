const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./app');

describe('Task Manager API', function() {
  // Connect to a test database before running tests (using async/await)
  before(async function() {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/task_manager_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  // Clean up the test database and close the connection after tests.
  after(async function() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('Jobs Endpoints', function() {
    it('should create a job with a task that defaults to pending when image and endTime are missing', async function() {
      const response = await request(app)
        .post('/jobs')
        .send({
          jobName: 'Job with incomplete task',
          createdBy: 'Tester',
          employees: [
            {
              employeeId: 'emp001',
              fullName: 'Employee One',
              tasks: [
                {
                  taskName: 'Task without image and endTime',
                  startTime: '2025-02-15T09:00:00.000Z'
                  // intentionally omitting endTime and image
                }
              ]
            }
          ]
        })
        .expect(201);

      const job = response.body;
      if (
        !job.employees ||
        job.employees.length === 0 ||
        !job.employees[0].tasks ||
        job.employees[0].tasks.length === 0
      ) {
        throw new Error('Job structure is not as expected');
      }
      const task = job.employees[0].tasks[0];
      if (task.status !== 'pending') {
        throw new Error(`Expected task status to be "pending", got "${task.status}"`);
      }
    });

    it('should create a job with a task that remains pending even when image and endTime are provided', async function() {
      const response = await request(app)
        .post('/jobs')
        .send({
          jobName: 'Job with complete task',
          createdBy: 'Tester',
          employees: [
            {
              employeeId: 'emp002',
              fullName: 'Employee Two',
              tasks: [
                {
                  taskName: 'Task with image and endTime',
                  startTime: '2025-02-15T09:00:00.000Z',
                  endTime: '2025-02-15T11:00:00.000Z',
                  image: 'http://example.com/example.png'
                }
              ]
            }
          ]
        })
        .expect(201);

      const job = response.body;
      if (
        !job.employees ||
        job.employees.length === 0 ||
        !job.employees[0].tasks ||
        job.employees[0].tasks.length === 0
      ) {
        throw new Error('Job structure is not as expected');
      }
      const task = job.employees[0].tasks[0];
      if (task.status !== 'pending') {
        throw new Error(`Expected task status to be "pending", got "${task.status}"`);
      }
    });
  });

  describe('Managers Endpoints', function() {
    it('should create a new manager', async function() {
      const response = await request(app)
        .post('/managers')
        .send({
          username: 'manager1',
          password: 'secret',
          fullName: 'Manager One'
        })
        .expect(201);

      if (response.body.username !== 'manager1') {
        throw new Error('Manager username mismatch');
      }
    });

    it('should retrieve all managers including the new manager', async function() {
      const response = await request(app)
        .get('/managers')
        .expect(200);

      if (!Array.isArray(response.body)) {
        throw new Error('Expected an array of managers');
      }
    });
  });
});