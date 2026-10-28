import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    logoUrl: { type: String, trim: true },
    aboutCompany: { type: String, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      required: true,
    },
    skills: [String],
    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'INR' },
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

export default mongoose.model('Job', jobSchema);
