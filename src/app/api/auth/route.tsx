import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM users`;

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

export async function POST(req: Request, res: NextApiResponse) {
  const { email, password } = await new Response(req.body).json();
  const rows = await sql`SELECT * FROM users where email = ${email}`;

  if (rows.length === 0) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  } else {
    const user = rows;
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Password not match' }, { status: 401 });
    } else {
      const token = jwt.sign({ id: user[0].uid }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return NextResponse.json({ token, user: user[0] }, { status: 200 });
    }
  }
}