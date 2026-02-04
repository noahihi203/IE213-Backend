import { userModel } from "../models/user.model.js";

interface UserFind {
  email: string;
  select?: Record<string, number>;
}

const findUserByEmail = async ({
  email,
  select = {
    email: 1,
    password: 1,
    fullName: 1,
    username: 1,
  },
}: UserFind) => {
  return await userModel.findOne({ email }).select(select).lean();
};

export { findUserByEmail };
