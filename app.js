const express = require('express');
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const cors = require('cors');
const app = express();

//====================================================================================

app.use(cors());
app.use(express.json());

//====================================================================================

mongoose
    .connect('mongodb+srv://KareemSab278:Assbook%4027@cluster.oa33q.mongodb.net/Vera_Cleaning', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.error('MongoDB connection error:', error));

//====================================================================================

const taskSchema = new mongoose.Schema({
    taskName: String,
    startTime: { type: Date },
    endTime: { type: Date },
    imageUrl: String, // Aligned with frontend
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    taskId: Number
});

//====================================================================================

taskSchema.pre('save', function(next) {
    if (this.endTime && this.imageUrl) {
        this.status = 'completed';
    }
    next();
});

taskSchema.plugin(AutoIncrement, { inc_field: 'taskId' });

const employeeSchema = new mongoose.Schema({
    employeeId: Number,
    fullName: String,
    tasks: [taskSchema],
});

const jobSchema = new mongoose.Schema({
    jobName: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    employees: [employeeSchema],
});

const Job = mongoose.model('Job', jobSchema);

const managerSchema = new mongoose.Schema({
    username: String,
    password: String,
    fullName: String,
});
managerSchema.plugin(AutoIncrement, { inc_field: 'id' });

const Manager = mongoose.model('Manager', managerSchema);

//====================================================================================

app.post('/jobs', async(req, res) => {
    try {
        const newJob = new Job(req.body);
        await newJob.save();
        res.status(201).json(newJob);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/managers', async(req, res) => {
    try {
        const newManager = new Manager(req.body);
        await newManager.save();
        res.status(201).json(newManager);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//============================================

app.get('/jobs', async(req, res) => {
    try {
        const jobs = await Job.find();
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//================

app.get('/managers', async(req, res) => {
    try {
        const managers = await Manager.find();
        res.json(managers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//================

app.get('/jobs/:jobId/employees', async(req, res) => {
    const { jobId } = req.params;
    try {
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ error: "Job not found" });
        res.json(job.employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//============================================

app.patch("/jobs/:jobId/assign", async(req, res) => {
    const { jobId } = req.params;
    const { fullName, task } = req.body;

    try {
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ error: "Job not found" });

        if (!fullName) {
            return res.status(400).json({ error: "Full name is required" });
        }

        let employee = job.employees.find(emp => emp.fullName === fullName);

        if (!task) {
            if (!employee) {
                job.employees.push({
                    fullName,
                    tasks: []
                });
            }
        } else if (task && task.taskName && task.imageUrl && task.startTime && task.endTime) {
            if (!employee) {
                return res.status(404).json({ error: "Employee not found. Create employee first." });
            }
            employee.tasks.push({
                taskName: task.taskName,
                imageUrl: task.imageUrl,
                startTime: task.startTime,
                endTime: task.endTime,
                status: task.status || "pending",
                taskId: task.taskId
            });
        } else {
            return res.status(400).json({ error: "Invalid task data: provide all task details (taskName, imageUrl, startTime, endTime)" });
        }

        await job.save();
        res.json(job);
    } catch (error) {
        console.error("Error saving employee or task:", error);
        res.status(500).json({ error: "Failed to save employee or task" });
    }
});

//====================================================================================

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
} else {
    module.exports = app;
}

//end