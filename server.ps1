$Port=8000
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$listener=New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try{$listener.Start()}catch{
 Write-Host "Could not start server on port $Port." -ForegroundColor Red
 Write-Host $_.Exception.Message
 Read-Host "Press Enter to exit"; exit 1
}
Write-Host ""
Write-Host "PORTFOLIO SERVER IS RUNNING" -ForegroundColor Green
Write-Host "Open http://localhost:8000" -ForegroundColor Cyan
Write-Host "Keep this window open." -ForegroundColor Yellow
Start-Process "http://localhost:8000"
$mime=@{".html"="text/html; charset=utf-8";".htm"="text/html; charset=utf-8";".js"="application/javascript; charset=utf-8";".css"="text/css; charset=utf-8";".xml"="application/xml; charset=utf-8";".json"="application/json; charset=utf-8";".jpg"="image/jpeg";".jpeg"="image/jpeg";".png"="image/png";".webp"="image/webp";".svg"="image/svg+xml";".gif"="image/gif";".ico"="image/x-icon";".woff"="font/woff";".woff2"="font/woff2";".mp4"="video/mp4";".webm"="video/webm"}
while($listener.IsListening){
 try{
  $ctx=$listener.GetContext()
  $path=[Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
  if($path -eq "/"){$path="/index.html"}
  $rel=$path.TrimStart("/") -replace "/","\"
  $full=[IO.Path]::GetFullPath((Join-Path $root $rel))
  if(-not $full.StartsWith($root,[StringComparison]::OrdinalIgnoreCase) -or -not(Test-Path -LiteralPath $full -PathType Leaf)){
   $ctx.Response.StatusCode=404;$b=[Text.Encoding]::UTF8.GetBytes("404 Not Found");$ctx.Response.OutputStream.Write($b,0,$b.Length);$ctx.Response.Close();continue
  }
  $b=[IO.File]::ReadAllBytes($full);$ext=[IO.Path]::GetExtension($full).ToLowerInvariant()
  if($mime.ContainsKey($ext)){$ctx.Response.ContentType=$mime[$ext]}else{$ctx.Response.ContentType="application/octet-stream"}
  $ctx.Response.ContentLength64=$b.Length;$ctx.Response.OutputStream.Write($b,0,$b.Length);$ctx.Response.Close()
 }catch{}
}
