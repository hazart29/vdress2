import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import sjcl from 'sjcl';

const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET(req: Request) {
    try {
        const rows = await sql`SELECT * FROM gacha_item`;

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

export async function POST(req: Request) {
    try {
        const { encryptedData } = await req.json(); // Terima data terenkripsi
        console.log("Data terenkripsi yang diterima:", encryptedData);
        const password = process.env.SJCL_PASSWORD; // Password yang sama dengan di client

        if (!password) {
            return NextResponse.json({ status: "invalidPassword", message: 'Invalid password', errorCode: 400 }, { status: 400 })
        }

        // Dekripsi data
        const decryptedData = JSON.parse(sjcl.decrypt(password as string, encryptedData));

        // Akses data yang sudah didekripsi
        const { uid, typeFetch, ...data } = decryptedData;

        if (!uid || !typeFetch) {
            return NextResponse.json({ message: 'uid and typeFetch are required' }, { status: 400 });
        }

        switch (typeFetch) {
            case 'updateGems':
                try {
                    const glamourGems = parseInt(data.glamour_gems || '0', 10);
                    if (isNaN(glamourGems)) {
                        return NextResponse.json({ message: 'Invalid glamour_gems value' }, { status: 400 });
                    }

                    // Validasi uid (contoh)
                    if (!uid || uid.length < 3) {
                        return NextResponse.json({ message: 'Invalid uid' }, { status: 400 });
                    }

                    const primoRows = await sql`SELECT glamour_gems FROM user_resources WHERE uid = ${uid}`;

                    if (primoRows.length === 0) {
                        return NextResponse.json({ message: 'User resources not found' }, { status: 404 });
                    }

                    const currentGlamourGems = primoRows[0].glamour_gems;
                    const newGlamourGems = currentGlamourGems - glamourGems;
                    await sql`UPDATE user_resources SET glamour_gems = ${newGlamourGems} WHERE uid = ${uid}`;
                    return NextResponse.json({ message: 'glamour_gems updated successfully' }, { status: 200 });

                } catch (error) {
                    console.error('Error updating glamour_gems:', error);
                    return NextResponse.json({ message: 'Failed to update glamour_gems', error: error }, { status: 500 });
                }

            case 'resetPity':
                const resetRows = await sql`SELECT * FROM user_resources WHERE uid = ${uid}`;
                if (resetRows.length > 0) {
                    await sql`UPDATE user_resources SET pity = 0 WHERE uid = ${uid}`;
                    return NextResponse.json({ message: 'pity updated to 0 successfully' }, { status: 200 });
                } else {
                    return NextResponse.json({ message: 'user not found' }, { status: 404 });
                }

            case 'updateEssence':
                try {
                    const { essence, type } = data;
                    console.log('updateessence data :', essence, type)

                    if (isNaN(essence)) {
                        return NextResponse.json({ message: 'Invalid essence value' }, { status: 400 });
                    }

                    switch (type) {
                        case 'limited':
                            await sql`UPDATE user_resources SET glimmering_essence = glimmering_essence - ${essence} WHERE uid = ${uid}`;
                            break;
                        case 'standard':
                            await sql`UPDATE user_resources SET shimmering_essence = shimmering_essence - ${essence} WHERE uid = ${uid}`;
                            break;
                        default:
                            break;
                    }

                    return NextResponse.json({ message: `${type} Essence updated successfully` }, { status: 200 });

                } catch (error) {
                    console.error('Error updating Essence:', error);
                    return NextResponse.json({ message: 'Failed to update Essence', error: error }, { status: 500 });
                }

            case 'incPity':
                const incPity = parseInt(data.incPity || '0', 10);
                const typePity = data.type;
                let updateQuery;

                if (isNaN(incPity)) {
                    return NextResponse.json({ message: 'Invalid incPity value' }, { status: 400 });
                }

                if (typePity === 'limited') {
                    updateQuery = sql`UPDATE user_resources SET pity = ${incPity} WHERE uid = ${uid}`;
                } else {
                    updateQuery = sql`UPDATE user_resources SET standard_pity = ${incPity} WHERE uid = ${uid}`;
                }

                try {
                    const result = await updateQuery;
                    if (result) {
                        return NextResponse.json({ message: 'Pity updated successfully' }, { status: 200 });
                    } else {
                        return NextResponse.json({ message: 'User not found, failed set pity' }, { status: 404 });
                    }
                } catch (error) {
                    console.error('Error updating pity:', error);
                    return NextResponse.json({ message: 'Failed to update pity' }, { status: 500 });
                }

            case 'upInven':
                try {
                    const { rarity, item_name, part_outfit, layer } = data;

                    if (!item_name || !rarity || !part_outfit || !layer) {
                        return NextResponse.json({ message: 'item_name, rarity, part_outfit, and layer are required' }, { status: 400 });
                    }

                    await sql`INSERT INTO inventory (uid, rarity, item_name, part_outfit, layer) 
                        VALUES (${uid}, ${rarity}, ${item_name}, ${part_outfit}, ${layer});`;

                    return NextResponse.json({ message: `${item_name}, push successfully` }, { status: 200 });

                } catch (error) {
                    console.error('Error updating inventory:', error);
                    return NextResponse.json({ message: 'Error updating inventory' }, { status: 500 });
                }

            case 'getPity':
                try {
                    const getPityRows = await sql`SELECT pity FROM user_resources WHERE uid = ${uid}`;
                    return NextResponse.json(getPityRows, { status: 200 });
                } catch (error) {
                    console.error('Error fetching pity:', error);
                    return NextResponse.json({ message: 'Failed to fetch pity', error: error }, { status: 500 });
                }

            case 'getStandardPity':
                try {
                    const getStandardRows = await sql`SELECT standard_pity FROM user_resources WHERE uid = ${uid}`;
                    return NextResponse.json(getStandardRows, { status: 200 });
                } catch (error) {
                    console.error('Error fetching pity:', error);
                    return NextResponse.json({ message: 'Failed to fetch pity', error: error }, { status: 500 });
                }

            case 'getRateUpItem':
                const getRarity = data.rarity;
                if (!getRarity) {
                    return NextResponse.json({ message: 'rarity is required' }, { status: 400 });
                }
                const getLimitedRows = await sql`SELECT * FROM gacha_item WHERE rarity = ${getRarity} AND rate_up = true`;
                return NextResponse.json(getLimitedRows, { status: 200 });

            case 'getRateOffItem':
                const getOffRarity = data.rarity;
                if (!getOffRarity) {
                    return NextResponse.json({ message: 'rarity is required' }, { status: 400 });
                }
                const getOffRows = await sql`SELECT * FROM gacha_item WHERE rarity = ${getOffRarity} AND rate_up = false`;
                return NextResponse.json(getOffRows, { status: 200 });

            case 'getRateOn':
                const rateOnRows = await sql`SELECT is_rate FROM user_resources WHERE uid = ${uid}`;
                return NextResponse.json(rateOnRows[0].is_rate, { status: 200 });

            case 'setRateOn':
                await sql`UPDATE user_resources SET is_rate = true WHERE uid = ${uid}`;
                return NextResponse.json({ message: 'is_rate set to true successfully' }, { status: 200 });

            case 'setRateOff':
                await sql`UPDATE user_resources SET is_rate = false WHERE uid = ${uid}`;
                return NextResponse.json({ message: 'is_rate set to false successfully' }, { status: 200 });

            case 'getGachaItem':
                const getGachaRarity = data.rarity;
                if (!getGachaRarity) {
                    return NextResponse.json({ message: 'rarity is required' }, { status: 400 });
                }
                const getGachaRows = await sql`SELECT * FROM gacha_item WHERE rarity = ${getGachaRarity}`;
                return NextResponse.json(getGachaRows, { status: 200 });

            case 'getStandardItem':
                const rarity = data.rarity;
                if (!getGachaRarity) {
                    return NextResponse.json({ message: 'rarity is required' }, { status: 400 });
                }
                const standardRows = await sql`SELECT * FROM gacha_item WHERE rarity = ${rarity} AND isLimited = 'false'`;
                return NextResponse.json(standardRows, { status: 200 });

            case 'getUserData':
                try {
                    const user = await sql`SELECT * FROM users WHERE uid = ${uid}`;
                    const inventory = await sql`SELECT * FROM inventory WHERE uid = ${uid}`;
                    const userResources = await sql`SELECT * FROM user_resources WHERE uid = ${uid}`;
                    const suited = await sql`SELECT * FROM suited WHERE uid = ${uid}`;

                    if (user.length === 0) {
                        return NextResponse.json({ message: 'User not found' }, { status: 404 });
                    }

                    const userData = {
                        ...user,
                        inventory: inventory,
                        user_resources: userResources,
                        suited: suited,
                    };

                    return NextResponse.json(userData, { status: 200 });
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    return NextResponse.json({ message: 'Error fetching user data' }, { status: 500 });
                }

            case 'getHistory':
                try {
                    const gacha_type = data.gacha_type;
                    console.log('gacha type : ', gacha_type);
                    const history = await sql`SELECT * FROM gacha_history WHERE uid = ${uid} AND gacha_type = ${gacha_type}`;
                    return NextResponse.json(history, { status: 200 });
                } catch (error) {
                    console.error('Error fetching history:', error);
                    return NextResponse.json({ message: 'Error fetching history' }, { status: 500 });
                }

            case 'upHistoryA':
                try {
                    const item_name = data.item_name;
                    const rarity = data.rarity;
                    const part_outfit = data.part_outfit;
                    const gacha_type = data.gacha_type;

                    if (!item_name || !rarity || !part_outfit || !gacha_type) {
                        return NextResponse.json({ message: 'item_name, rarity, part_outfit, and gacha_type are required' }, { status: 400 });
                    }
                    await sql`
                          INSERT INTO gacha_history (uid, rarity, item_name, part_outfit, gacha_type) 
                          VALUES (${uid}, ${rarity}, ${item_name}, ${part_outfit}, ${gacha_type});
                        `;

                    return NextResponse.json({ message: `${item_name} push successfully` }, { status: 200 });
                } catch (error) {
                    console.error('Error adding history:', error);
                    return NextResponse.json({ message: 'Error adding history' }, { status: 500 });
                }

            case 'exchangeGemsForEssence':
                try {
                    const type = data.type;
                    const glamourGems = parseInt(data.glamour_gems || '0', 10);
                    let essence;
                    if (type === 'glimmering_essence') {
                        essence = parseInt(data.glimmering_essence || '0', 10);
                    } else {
                        essence = parseInt(data.shimmering_essence || '0', 10);
                    }


                    if (isNaN(glamourGems) || isNaN(essence)) {
                        return NextResponse.json({ message: 'Invalid glamour_gems or essence value' }, { status: 400 });
                    }

                    // 1. Kurangi glamour_gems
                    await sql`
                        UPDATE user_resources 
                        SET glamour_gems = glamour_gems - ${glamourGems} 
                        WHERE uid = ${uid}
                      `;

                    if (type === 'glimmering_essence') {
                        // 2. Tambahkan glimmering_essence
                        await sql`UPDATE user_resources SET glimmering_essence = glimmering_essence + ${essence} WHERE uid = ${uid}`;
                    } else {
                        await sql`UPDATE user_resources SET shimmering_essence = shimmering_essence + ${essence} WHERE uid = ${uid}`;
                    }


                    return NextResponse.json({ message: 'Gems exchanged for essence successfully' }, { status: 200 });

                } catch (error) {
                    console.error('Error exchanging gems for essence:', error);
                    return NextResponse.json({ message: 'Failed to exchange gems for essence', error: error }, { status: 500 });
                }

            case 'updateGlamourDust':
                try {
                    const glamourDust = parseInt(data.glamour_dust || '0', 10);

                    if (isNaN(glamourDust)) {
                        return NextResponse.json({ message: 'Invalid glamour_dust value' }, { status: 400 });
                    }

                    await sql`
                        UPDATE user_resources 
                        SET glamour_dust = glamour_dust + ${glamourDust} 
                        WHERE uid = ${uid}
                    `;

                    return NextResponse.json({ message: 'Glamour Dust updated successfully' }, { status: 200 });

                } catch (error) {
                    console.error('Error updating Glamour Dust:', error);
                    return NextResponse.json({ message: 'Failed to update Glamour Dust', error: error }, { status: 500 });
                }

            case 'updateFashionTokens':
                try {
                    const glamourDust = parseInt(data.fashion_tokens || '0', 10);

                    if (isNaN(glamourDust)) {
                        return NextResponse.json({ message: 'Invalid fashion_tokens value' }, { status: 400 });
                    }

                    await sql`
                        UPDATE user_resources 
                        SET fashion_tokens = fashion_tokens + ${glamourDust} 
                        WHERE uid = ${uid}
                    `;

                    return NextResponse.json({ message: 'fashion_tokens updated successfully' }, { status: 200 });

                } catch (error) {
                    console.error('Error updating fashion_tokens:', error);
                    return NextResponse.json({ message: 'Failed to update fashion_tokens', error: error }, { status: 500 });
                }

            default:
                return NextResponse.json({ message: 'Invalid typeFetch' }, { status: 400 });
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ status: "internalError", message: 'Internal server error', errorCode: 500 }, { status: 500 });
    }
}