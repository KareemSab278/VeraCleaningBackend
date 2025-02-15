const express = require('express');
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const app = express();

// Middleware to parse JSON bodies
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
  employeeId: String, // You can also consider auto-incrementing this if numeric IDs are desired
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

// Routes for Managers

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