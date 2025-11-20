// Normalize copy at the edge to keep app text consistent
// Maps: game/Game -> activity, games/Games -> activities
// Also fixes the article before "activity": "a activity" -> "an activity"
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
// Regexes
const singularRegex = /\b[Gg]ame\b/g; // game/Game -> activity
const pluralRegex = /\b[Gg]ames\b/g; // games/Games -> activities
// Handles start or non-word before A/a and the word activity following
const aBeforeActivityRegexUpper = /(^|\W)A activity/g; // "A activity" -> "An activity"
const aBeforeActivityRegexLower = /(^|\W)a activity/g; // "a activity" -> "an activity"
function fixArticleBeforeActivity(input) {
  return input.replace(aBeforeActivityRegexUpper, "$1An activity").replace(aBeforeActivityRegexLower, "$1an activity");
}
function normalizeText(input) {
  if (!input) return input;
  // 1) Plural first to avoid partial replacements (e.g., "Games" -> "activities")
  let out = input.replace(pluralRegex, "activities");
  // 2) Singular afterwards ("game" -> "activity")
  out = out.replace(singularRegex, "activity");
  // 3) Fix articles before the normalized word
  out = fixArticleBeforeActivity(out);
  return out;
}
console.info("normalize-copy function started");
Deno.serve(async (req)=>{
  const url = new URL(req.url);
  const pathname = url.pathname;
  // Route: /normalize-copy/preview
  if (pathname.startsWith("/normalize-copy/preview")) {
    try {
      const { text } = await req.json();
      return new Response(JSON.stringify({
        input: text,
        output: normalizeText(text)
      }), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (_) {
      return new Response(JSON.stringify({
        error: "Invalid JSON"
      }), {
        status: 400
      });
    }
  }
  // Route: /normalize-copy/notifications
  // Optionally normalize a notification payload before insert
  if (pathname.startsWith("/normalize-copy/notifications")) {
    try {
      const body = await req.json();
      const normalized = {
        ...body,
        title: normalizeText(body.title),
        message: normalizeText(body.message)
      };
      const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
        auth: {
          persistSession: false
        }
      });
      const { data, error } = await supabase.from("notifications").insert(normalized).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({
        data
      }), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({
        error: String(e)
      }), {
        status: 400
      });
    }
  }
  return new Response(JSON.stringify({
    ok: true,
    routes: [
      "/normalize-copy/preview",
      "/normalize-copy/notifications"
    ]
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
});
