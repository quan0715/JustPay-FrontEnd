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
    allowances: user.allowances ?? [],
  } as User;
}

export async function createUserData(address: string) {
  const client = await clientPromise;
  const db = client.db("user");
  const user = await db.collection("user").insertOne({
    address: address,
    allowances: [],
  });
  return user;
}

export async function updateUserData(user: User) {
  try {
    const client = await clientPromise;
    const db = client.db("user");
    const result = await db.collection("user").updateOne(
      {
        address: user.address,
      },
      {
        $set: {
          allowances: user.allowances,
        },
      }
    );
    return result;
  } catch (error) {
    console.error("更新用戶數據時發生錯誤:", error);
    throw error;
  }
}
