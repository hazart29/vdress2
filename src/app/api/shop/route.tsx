import { DustItems, GachaItem, TokenItems, User_resources, UserTokenLimit, UserDustLimit } from "@/app/interface";
import sjcl from "sjcl";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { UUID } from "crypto";

const password = process.env.SJCL_PASSWORD; // Retrieve password from environment variables
const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM products`;
    return new NextResponse(JSON.stringify({ message: 'successful', rows }), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { encryptedData } = await req.json();
    const decryptedData = JSON.parse(sjcl.decrypt(password as string, encryptedData));
    const { uid, typeFetch, ...dataFetch } = decryptedData;

    switch (typeFetch) {
      case "getUserResource": {
        const userResources = await sql`SELECT * FROM user_resources WHERE uid = ${uid}`;
        return NextResponse.json({ message: 'Successful', userResources: userResources || null }, { status: 200 });
      }

      case "getTokenItems": {
        const tokenItems = await sql`SELECT ti.*, utl.limit FROM token_items ti
        LEFT JOIN user_token_limit utl ON ti.id = utl.item_id AND utl.uid = ${uid}`;

        return NextResponse.json({ message: 'Successful', tokenItems });
      }

      case "getDustItems": {
        const dustItems = await sql`
          SELECT di.*, udl.limit
          FROM dust_items di
          LEFT JOIN user_dust_limit udl ON di.id = udl.item_id AND udl.uid = ${uid}
          ORDER BY di.id`;

        const returnData = { dustItems: dustItems || [] };
        const encryptedReturnData = sjcl.encrypt(password as string, JSON.stringify(returnData));
        return NextResponse.json({ message: 'Successful', encryptedData: encryptedReturnData }, { status: 200 });
      }

      case "restockTokenItems": {
        try {
          const tokenLimits = await sql`SELECT * FROM user_token_limit`;
          for (const limit of tokenLimits) {
            await sql`UPDATE user_token_limit SET limit = initial_limit WHERE id = ${limit.item_id}`;
          }
          return NextResponse.json({ message: 'Token items restocked successfully' }, { status: 200 });
        } catch (error) {
          console.error("Error during token items restock:", error);
          return NextResponse.json({ message: 'Token items restock failed' }, { status: 500 });
        }
      }

      case "restockDustItems": {
        try {
          const dustLimits = await sql`SELECT * FROM user_dust_limit`;
          for (const limit of dustLimits) {
            await sql`UPDATE user_dust_limit SET limit = initial_limit WHERE id = ${limit.item_id}`;
          }
          return NextResponse.json({ message: 'Dust items restocked successfully' }, { status: 200 });
        } catch (error) {
          console.error("Error during dust items restock:", error);
          return NextResponse.json({ message: 'Dust items restock failed' }, { status: 500 });
        }
      }

      case "topUp": {
        const { packageId } = dataFetch;

        try {
          const packageInfo: any = await sql`SELECT glamour_gems FROM products WHERE id = ${packageId}`;
          if (!packageInfo || packageInfo.length === 0) { // Check for empty result
            return NextResponse.json({ message: 'Package not found' }, { status: 404 });
          }
          const gemsToAdd = packageInfo[0].glamour_gems; // Access the first element of the result array

          const userResources: any = await sql`SELECT glamour_gems FROM user_resources WHERE uid = ${uid}`;
          if (!userResources || userResources.length === 0) { // Check for empty result
            return NextResponse.json({ error: 'User resources not found' }, { status: 404 });
          }
          const currentGems = userResources[0].glamour_gems; // Access the first element of the result array

          const newGems = currentGems + gemsToAdd;

          await sql`UPDATE user_resources SET glamour_gems = ${newGems} WHERE uid = ${uid}`;

          return NextResponse.json({ message: 'Top-up successful', newGems }, { status: 200 });

        } catch (error) {
          console.error("Error during top-up:", error); // Log the full error to the console
          return NextResponse.json({ error: 'An error occurred during top-up' }, { status: 500 }); // Return a generic error to the client
        }
      }

      case "exchangeManyGems": {
        const { essence, selectedEssence } = dataFetch;

        try {
          const userResources: any = await sql`SELECT * FROM user_resources WHERE uid = ${uid}`;
          if (!userResources || userResources.length === 0) {
            return NextResponse.json({ message: 'User resources not found' }, { status: 404 });
          }

          const resources = userResources[0]; // Access the first element of the result

          if (resources.glamour_gems < 160 * essence) {
            return NextResponse.json({ message: 'Not enough glamour gems' }, { status: 400 });
          }

          let updatedGlamourGems : Number = resources.glamour_gems - (160 * essence);
          let updatedShimmeringEssence : Number = resources.shimmering_essence;
          let updatedGlimmeringEssence : Number = resources.glimmering_essence;

          if (selectedEssence === "shimmering_essence") {
            updatedShimmeringEssence += essence;
          } else if (selectedEssence === "glimmering_essence") {
            updatedGlimmeringEssence += essence;
          } else {
            return NextResponse.json({ message: 'Invalid essence type' }, { status: 400 });
          }

          console.log(updatedGlamourGems,updatedGlamourGems,updatedGlimmeringEssence,uid)

          const updateResult = await sql`
                UPDATE user_resources 
                SET glamour_gems = ${updatedGlamourGems}, 
                    shimmering_essence = ${updatedGlamourGems}, 
                    glimmering_essence = ${updatedGlimmeringEssence} 
                WHERE uid = ${uid}
            `;

          return NextResponse.json({ message: 'Essence exchange successful' }, { status: 200 });

        } catch (error) {
          console.error("Error during essence exchange:", error);
          return NextResponse.json({ message: 'An error occurred during essence exchange' }, { status: 500 });
        }
      }

      case "buyTokenItem": {
        const { itemId, quantity } = dataFetch;

        if (!itemId || !quantity || quantity <= 0) {
          return NextResponse.json({ message: 'Invalid item or quantity' }, { status: 400 });
        }

        try {
          await sql`BEGIN`;

          const item: any = await sql`SELECT id, name, price FROM token_items WHERE id = ${itemId}`;
          if (!item) {
            await sql`ROLLBACK`;
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
          }

          const userResources: any = await sql`SELECT fashion_tokens, shimmering_essence, glimmering_essence FROM user_resources WHERE uid = ${uid}`;
          if (!userResources) {
            await sql`ROLLBACK`;
            return NextResponse.json({ message: 'User resources not found' }, { status: 404 });
          }

          const userLimit: any = await sql`SELECT * FROM user_token_limit WHERE uid = ${uid} AND item_id = ${itemId}`;
          if (userLimit.limit !== null && userLimit.limit < quantity) {
            await sql`ROLLBACK`;
            return NextResponse.json({ message: 'Purchase limit exceeded' }, { status: 400 });
          }

          const totalPrice = item.price * quantity;
          if (userResources.fashion_tokens < totalPrice) {
            await sql`ROLLBACK`;
            return NextResponse.json({ message: 'Not enough fashion tokens' }, { status: 400 });
          }

          const newTokens = userResources.fashion_tokens - totalPrice;
          await sql`UPDATE user_resources SET fashion_tokens = ${newTokens} WHERE uid = ${uid}`;

          if (itemId === 1) {
            const newShimmeringEssence = userResources.shimmering_essence + quantity;
            await sql`UPDATE user_resources SET shimmering_essence = ${newShimmeringEssence} WHERE uid = ${uid}`;
          } else if (itemId === 2) {
            const newGlimmeringEssence = userResources.glimmering_essence + quantity;
            await sql`UPDATE user_resources SET glimmering_essence = ${newGlimmeringEssence} WHERE uid = ${uid}`;
          }

          if (userLimit.limit) {
            const updatedUserLimit = userLimit.limit - quantity;
            await sql`UPDATE user_token_limit SET limit = ${updatedUserLimit} WHERE id = ${userLimit.id}`;
          } else {
            const initialLimit = quantity; // Initialize limit for first-time purchase
            await sql`INSERT INTO user_token_limit (uid, item_id, limit, initial_limit) VALUES (${uid}, ${itemId}, ${-quantity}, ${initialLimit})`;
          }

          await sql`COMMIT`;
          return NextResponse.json({ message: 'Purchase successful' }, { status: 200 });
        } catch (error) {
          await sql`ROLLBACK`;
          console.error('Database error during purchase:', error);
          return NextResponse.json({ message: 'Purchase failed' }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({ message: 'Invalid fetch type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
