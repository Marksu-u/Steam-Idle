using System.Runtime.InteropServices;

if (args.Length < 1 || !uint.TryParse(args[0], out uint appId))
{
    Console.WriteLine("Usage: idler.exe <appid> [durationMs] [name]");
    return 1;
}

long durationMs = args.Length > 1 && long.TryParse(args[1], out long d) ? d : 0;
// The launcher passes the (untrusted) game name via env var so it never
// touches the command line / shell. Fall back to argv, then the appid.
string name = Environment.GetEnvironmentVariable("IDLER_NAME")
    ?? (args.Length > 2 ? args[2] : appId.ToString());

// Steam looks for this file (or the SteamAppId env var) to know which app is "running".
File.WriteAllText("steam_appid.txt", appId.ToString());
Environment.SetEnvironmentVariable("SteamAppId", appId.ToString());

if (!SteamAPI.Init())
{
    Console.WriteLine($"Failed to initialize Steam API for '{name}' ({appId}). Make sure Steam is running and you own this game.");
    return 1;
}

// Setting the title throws if the process has no console; never let that
// kill an otherwise-healthy idler.
try { Console.Title = $"Idling - {name}"; } catch { }
Console.WriteLine($"Idling '{name}' (AppID {appId})" + (durationMs > 0 ? $" for {TimeSpan.FromMilliseconds(durationMs)}." : " indefinitely."));

var stopwatch = System.Diagnostics.Stopwatch.StartNew();
while (durationMs <= 0 || stopwatch.ElapsedMilliseconds < durationMs)
{
    SteamAPI.RunCallbacks();
    Thread.Sleep(1000);
}

SteamAPI.Shutdown();
return 0;

// Minimal bindings for the handful of flat Steamworks functions we need.
// Avoids Steamworks.NET's CSteamAPIContext, which eagerly resolves every
// optional interface (GameSearch, Inventory, etc.) and can fail to load
// if the bundled steam_api64.dll doesn't export one of them.
internal static class SteamAPI
{
    // SteamAPI_Init was removed from recent SDKs in favor of SteamAPI_InitFlat,
    // which returns an ESteamAPIInitResult (0 == k_ESteamAPIInitResult_OK) plus
    // an error message buffer (SteamErrMsg, char[1024]).
    [DllImport("steam_api64.dll")]
    public static extern int SteamAPI_InitFlat([MarshalAs(UnmanagedType.LPArray, SizeConst = 1024)] byte[] errMsg);

    [DllImport("steam_api64.dll")]
    public static extern void SteamAPI_Shutdown();

    [DllImport("steam_api64.dll")]
    public static extern void SteamAPI_RunCallbacks();

    public static bool Init()
    {
        var errMsg = new byte[1024];
        int result = SteamAPI_InitFlat(errMsg);
        if (result != 0)
        {
            Console.WriteLine($"SteamAPI_InitFlat failed ({result}): {System.Text.Encoding.UTF8.GetString(errMsg).TrimEnd('\0')}");
            return false;
        }
        return true;
    }

    public static void Shutdown() => SteamAPI_Shutdown();
    public static void RunCallbacks() => SteamAPI_RunCallbacks();
}
