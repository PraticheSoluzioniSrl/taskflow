import { auth } from "@/lib/auth";
import { getTasksByUserId, createTask } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTasks = await getTasksByUserId(session.user.id);

    return NextResponse.json(userTasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, dueDate, projectId, important, tags, subtasks } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const newTask = await createTask({
      userId: session.user.id,
      title,
      description: description || undefined,
      status: status || "todo",
      dueDate: dueDate || undefined,
      projectId: projectId || undefined,
      important: important || false,
      completed: false,
      tags: tags || [],
      subtasks: subtasks || [],
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
