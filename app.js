const express = require('express');
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const cors = require('cors'); // Import the cors package
const app = express();

// Middleware to parse JSON bodies
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/task_manager', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Define Task schema (subdocument)
const taskSchema = new mongoose.Schema({
  taskName: String,
  startTime: { type: Date },
  endTime: { type: Date },
  image: String,
  status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
});

// Pre-save middleware to update status based on provided fields
taskSchema.pre('save', function(next) {
  // If both image and endTime are provided, mark as completed
  if (this.endTime && this.image) {
    this.status = 'completed';
  }
  next();
});

// Auto-increment taskId field
taskSchema.plugin(AutoIncrement, { inc_field: 'taskId' });

// Define Employee schema (subdocument)
const employeeSchema = new mongoose.Schema({
  employeeId: Number, //changed this to number because of auto-incrementation
  fullName: String,
  tasks: [taskSchema],
});

// Define Job schema
const jobSchema = new mongoose.Schema({
  jobName: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  employees: [employeeSchema],
});

// Create Job model
const Job = mongoose.model('Job', jobSchema);

// Define Manager schema
const managerSchema = new mongoose.Schema({
  username: String,
  password: String,
  fullName: String,
});
// Auto-increment id field for Manager
managerSchema.plugin(AutoIncrement, {inc_field: 'id'});

// Create Manager model
const Manager = mongoose.model('Manager', managerSchema);

// Routes for Jobs
// Create a new job
app.post('/jobs', async (req, res) => {
  try {
    const newJob = new Job(req.body);
    await newJob.save();
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all jobs
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// app.get('/employee', async (req, res) => {
//   try {
//     const employee = await Employee.find();
//     res.json(employee);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

//wrote all this and forgot i dont even have a collection for employees -_- ...

// // create a new employee
// app.post('/employee', async (req, res) => {
//   try{const newEmployee = new Employee(req.body);
//     await newEmployee.save();
//     res.status(201).json(newEmployee);}
//     catch{
//       console.error('failed to create a new emp', 400)
//     }
// })

// Create a new manager
app.post('/managers', async (req, res) => {
  try {
    const newManager = new Manager(req.body);
    await newManager.save();
    res.status(201).json(newManager);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all managers
app.get('/managers', async (req, res) => {
  try {
    const managers = await Manager.find();
    res.json(managers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} else {
  module.exports = app;
}

//Update the job for employees arr and add them in
app.patch("/jobs/:jobId/assign", async (req, res) => {
  const { jobId } = req.params;
  const { employeeName, employeeTask } = req.body;

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    let employee = job.employees.find(emp => emp.fullName === employeeName);

    if (employee) {
      // Employee exists, add task if not already in the list
      if (!employee.tasks.some(task => task.taskName === employeeTask)) {
        employee.tasks.push({ taskName: employeeTask });
      }
    } else {
      // Add new employee with task
      job.employees.push({
        fullName: employeeName,
        tasks: [{ taskName: employeeTask }],
      });
    }

    await job.save();
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Failed to assign employee" });
  }
});


// Get all employees from a specific job
app.get('/jobs/:jobId/employees', async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job.employees); // Send employees array
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
