// get user data from database
"use server";
import clientPromise from "@/lib/mongo";
import User from "@/models/user";

export async function getUserData(address: string) {
  const client = await clientPromise;
  const db = client.db("user");
  const user = await db.collection("user").findOne({
    address: address,
  });
  if (!user) {
    return null;
  }
  return {
    address: user.address ?? "",
    salt: user.salt ?? 0,
    spenderAddress: user.spenderAddress ?? "",
    allowances: user.allowances ?? [],
  } as User;
}

export async function createUserData(address: string) {
  const client = await clientPromise;
  const db = client.db("user");
  // get random salt value (Integer 0 - 10000)
  const randomSaltValue = Math.floor(Math.random() * 10000);
  const user = await db.collection("user").insertOne({
    address: address,
    spenderAddress: "",
    salt: randomSaltValue,
    allowances: [],
  });
  return user;
}

export async function updateUserData(user: User) {
  try {
    console.log("updateUserData", user);
    const client = await clientPromise;
    const db = client.db("user");
    const result = await db.collection("user").updateOne(
      {
        address: user.address,
      },
      {
        $set: {
          ...user,
        },
      }
    );
    return result;
  } catch (error) {
    console.error("更新用戶數據時發生錯誤:", error);
    throw error;
  }
}
