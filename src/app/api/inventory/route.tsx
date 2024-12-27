import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import sjcl from "sjcl";

const sql = neon(`${process.env.DATABASE_URL}`);
const password = process.env.SJCL_PASSWORD; // Retrieve password from environment variables

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM inventory`;

    if (rows.length > 0) {
      return NextResponse.json(
        {
          status: "success",
          message: "Successed getting api data",
          statusCode: 200,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          status: "notFound",
          message: "Data not found",
          errorCode: 404,
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        status: "internalError",
        message: "Internal server error",
        errorCode: 500,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { encryptedData } = await req.json();

    if (!encryptedData) {
      return NextResponse.json({
        status: "badRequest",
        message: "Encrypted data is required",
        errorCode: 400,
      }, { status: 400 });
    }

    try {
      const decryptedData = JSON.parse(sjcl.decrypt(password as string, encryptedData));
      const uid = decryptedData.uid;

      if (!uid) {
        return NextResponse.json({
          status: "badRequest",
          message: "UID is required in decrypted data",
          errorCode: 400,
        }, { status: 400 });
      }

      const rows = await sql`SELECT * FROM inventory WHERE uid = ${uid}`;
      const encryptedResponse = sjcl.encrypt(password as string, JSON.stringify({ inventory: rows }));

      return NextResponse.json({
        status: "success",
        message: "Inventory retrieved successfully",
        encryptedData: encryptedResponse,
        statusCode: 200,
      }, { status: 200 });

    } catch (decryptError) {
      console.error("Decryption error:", decryptError);
      return NextResponse.json({
        status: "badRequest",
        message: "Invalid encrypted data",
        errorCode: 400,
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({
      status: "internalError",
      message: "An unexpected error occurred",
      errorCode: 500,
    }, { status: 500 });
  }
}