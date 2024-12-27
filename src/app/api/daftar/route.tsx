import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import sjcl from 'sjcl';
import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);
const pwd = process.env.SJCL_PASSWORD; // Retrieve password from environment variables

export async function POST(req: Request) {
    try {
        const { encryptedData } = await req.json();
        const decryptedData = JSON.parse(sjcl.decrypt(pwd as string, encryptedData));
        const { username, password, email, name } = decryptedData;

        console.log('data masuk: ', decryptedData);

        if (!username || !password || !email || !name) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await sql`SELECT * FROM users WHERE email = ${email} OR username = ${username}`;
        if (existingUser.length > 0) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate UUID
        const uid = uuidv4();

        const result = await sql`
            INSERT INTO users (uid, username, password, email, name)
            VALUES (${uid}, ${username}, ${hashedPassword}, ${email}, ${name})
            RETURNING *
        `;

        const newUser = result;

        if (newUser) {
            try {
                const suited = await sql`
                    INSERT INTO suited (uid, a, b, c) 
                    VALUES (${uid}, 'default', 'default', 'default') 
                `;

                const user_resources = await sql`
                INSERT INTO user_resources (uid, chic_coins, glamour_gems, glamour_dust, 
                fashion_tokens, shimmering_essence, glimmering_essence, 
                pity, is_rate, standard_pity, neonite, chromite)
                VALUES (${uid}, 0, 0, 0, 0, 0, 0, 0, false, 0, 0, 0)
              `;

                const tokenItems = await sql`SELECT * FROM token_items`;
                for (let i = 0; i < tokenItems.length; i++) {
                    if (tokenItems[i].id === 1 || tokenItems[i].id === 2) {
                        await sql`INSERT INTO user_token_limit (uid, item_id, "limit", initial_limit)
                    VALUES (${uid}, ${tokenItems[i].id}, ${null}, ${null})`;
                    } else {
                        await sql`INSERT INTO user_token_limit (uid, item_id, "limit", initial_limit)
                    VALUES (${uid}, ${tokenItems[i].id}, 1, 1)`;
                    }
                }

                const dustItems = await sql`SELECT * FROM dust_items`;
                for (let i = 0; i < dustItems.length; i++) {
                    if (dustItems[i].id === 1 || 2) {
                        await sql`INSERT INTO user_dust_limit (uid, item_id, "limit", initial_limit)
                        VALUES (${uid}, ${dustItems[i].id}, 5, 5)`;
                    }
                }

                console.log("Data inserted into other table:", suited, user_resources);
            } catch (otherTableError) {
                console.error("Error inserting into other table:", otherTableError);
                await sql`DELETE FROM suited WHERE uid = ${uid}`;
                await sql`DELETE FROM user_resources WHERE uid = ${uid}`;
                await sql`DELETE FROM user_token_limit WHERE uid = ${uid}`;
                await sql`DELETE FROM user_dust_limit WHERE uid = ${uid}`;
                await sql`DELETE FROM users WHERE uid = ${uid}`;

                return NextResponse.json({ message: 'Failed to create user data in other table. User creation rolled back.' }, { status: 500 });

            }

            const encryptedResponse = sjcl.encrypt(pwd as string, JSON.stringify({ newUser: newUser }));
            return NextResponse.json({
                status: "success",
                message: "User created successfully",
                encryptedData: encryptedResponse,
                statusCode: 200,
            }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}