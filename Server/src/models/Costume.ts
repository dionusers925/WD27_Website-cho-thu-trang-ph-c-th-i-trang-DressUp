import mongoose from "mongoose";

const costumeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
    },
    stock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Costume = mongoose.model("Costume", costumeSchema);

export default Costume;
