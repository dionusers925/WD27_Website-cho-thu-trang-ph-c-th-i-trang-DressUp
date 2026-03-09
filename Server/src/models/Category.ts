import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  isActive: Boolean,
  sortOrder: Number,
});

export default mongoose.model("Category", categorySchema);
