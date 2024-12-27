// pages/api/outfit.js
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import sjcl from 'sjcl';

const password = process.env.SJCL_PASSWORD;
const sql = neon(`${process.env.DATABASE_URL}`);

export async function POST(req: Request) {
    try {
        const { encryptedData } = await req.json(); // Ambil data terenkripsi dari body

        if (!encryptedData) {
            return NextResponse.json({
                status: "badRequest",
                message: "Encrypted data is required",
                errorCode: 400,
            }, { status: 400 });
        }

        try {
            const decryptedData = JSON.parse(sjcl.decrypt(password as string, encryptedData));
            const { action, uid, top, bottom, feet, layer } = decryptedData; // Dekripsi dan ekstrak data

            if (!uid || !action) {
                return NextResponse.json({
                    status: "badRequest",
                    message: "Missing uid or action in decrypted data",
                    errorCode: 400
                }, { status: 400 });
            }

            switch (action) {
                case "updateOutfit":
                    if (!top || !bottom || !feet) {
                        return NextResponse.json({
                            status: "badRequest",
                            message: "Missing required fields for updateOutfit",
                            errorCode: 400
                        }, { status: 400 });
                    }

                    const updateResult = await sql`UPDATE suited SET a = ${top}, b = ${bottom}, c = ${feet} WHERE uid = ${uid}`;

                    if (updateResult.length > 0) {
                        const encryptedResponse = sjcl.encrypt(password as string, JSON.stringify({ message: "Outfit updated successfully" }));
                        return NextResponse.json({ status: "success", encryptedData: encryptedResponse, statusCode: 200 }, { status: 200 });
                    } else {
                        return NextResponse.json({ status: "notFound", message: "User not found", errorCode: 404 }, { status: 404 });
                    }
                    break;
                case "getOutfitData":
                    const rows = await sql`SELECT * FROM suited WHERE uid = ${uid}`;
                    const encryptedResponseGetOutfit = sjcl.encrypt(password as string, JSON.stringify(rows));
                    return NextResponse.json({ encryptedData: encryptedResponseGetOutfit, status: 200 }, { status: 200 });

                case "getOutfitByLayer":
                    if (!layer) {
                        return NextResponse.json({
                            status: "badRequest",
                            message: "Missing layer for getOutfitByLayer",
                            errorCode: 400
                        }, { status: 400 });
                    }

                    const outfitLayer = await sql`SELECT * FROM inventory WHERE layer = ${layer} AND uid = ${uid} AND rarity !='R'`;
                    const encryptedResponseGetOutfitLayer = sjcl.encrypt(password as string, JSON.stringify(outfitLayer));
                    return NextResponse.json({ encryptedData: encryptedResponseGetOutfitLayer, status: 200 }, { status: 200 });
                default:
                    return NextResponse.json({ status: "badRequest", message: "Invalid action", errorCode: 400 }, { status: 400 });
            }
        } catch (decryptError) {
            console.error("Decryption error:", decryptError);
            return NextResponse.json({
                status: "badRequest",
                message: "Invalid encrypted data",
                errorCode: 400,
            }, { status: 400 });
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ status: "internalError", message: "Internal server error", errorCode: 500 }, { status: 500 });
    }
}

export async function GET() {
    try {
        const rows = await sql`SELECT * FROM suited`;

        if (rows) {
            return NextResponse.json({ status: "success", message: 'Successed getting api data', statusCode: 200 }, { status: 200 });
        } else {
            return NextResponse.json({ status: "notFound", message: 'Data not found', errorCode: 404 }, { status: 404 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ status: "internalError", message: 'Internal server error', errorCode: 500 }, { status: 500 });
    }
}