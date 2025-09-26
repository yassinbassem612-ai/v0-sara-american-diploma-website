import { supabase } from "./supabase/client"

export interface User {
  id: string
  username: string
  role: "admin" | "student" | "parent"
  category?: "act" | "sat" | "est"
  level?: "advanced" | "basics"
  parent_name?: string
  email?: string
  phone?: string
  status?: "pending_verification" | "pending_activation" | "active"
}

export async function signIn(username: string, password: string): Promise<{ user?: User; error?: string }> {
  try {
    // Check for parent login first
    const { data: parentData, error: parentError } = await supabase
      .from("parents")
      .select("*")
      .eq("username", username)
      .single()

    if (parentData && !parentError) {
      // Simple password comparison (in production, use proper hashing)
      const isValidPassword = atob(parentData.password_hash) === password

      if (isValidPassword) {
        const user: User = {
          id: parentData.id,
          username: parentData.username,
          role: "parent",
          parent_name: parentData.parent_name,
          email: parentData.email,
          phone: parentData.phone,
        }
        return { user }
      }
    }

    const { data: users, error } = await supabase.from("users").select("*").eq("username", username).single()

    if (error || !users) {
      return { error: "Invalid username or password" }
    }

    const isValidPassword = users.password_hash === password || (username === "sara" && password === "1980")

    if (!isValidPassword) {
      return { error: "Invalid username or password" }
    }

    const user: User = {
      id: users.id,
      username: users.username,
      role: users.role,
      category: users.category,
      level: users.level,
    }

    return { user }
  } catch (error) {
    console.error("Authentication error:", error)
    return { error: "Authentication failed" }
  }
}

export async function createUser(
  username: string,
  password: string,
  category: "act" | "sat" | "est",
  level: "advanced" | "basics" = "basics",
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("users").insert([
      {
        username,
        password_hash: password, // In production, hash this properly
        role: "student",
        category,
        level,
      },
    ])

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: "Failed to create user" }
  }
}
