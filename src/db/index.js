import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host} \n`
    );
  } catch (error) {
    console.log("\nMONGO Connection Error \n", error);
    process.exit(1);
  }
};

export default connectDB;
