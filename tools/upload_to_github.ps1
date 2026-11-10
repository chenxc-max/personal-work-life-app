param(
    [string]$Owner = 'chenxc-max',
    [string]$Repository = 'personal-work-life-app',
    [string]$Branch = 'main'
)

$ErrorActionPreference = 'Stop'

$credentialText = "protocol=https`nhost=github.com`n`n" | git credential fill
$tokenLine = ($credentialText -split "`n" | Where-Object { $_ -like 'password=*' } | Select-Object -First 1)
if (-not $tokenLine) {
    throw 'GitHub credential not found. Run: git credential-manager github login --device --no-ui'
}
$token = $tokenLine.Substring(9)

$headers = @{
    Authorization = "Bearer $token"
    'User-Agent' = 'Codex'
    Accept = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
}

$root = (Resolve-Path -LiteralPath '.').Path
$apiRoot = "https://api.github.com/repos/$Owner/$Repository"
$files = git -c core.quotepath=false ls-files
if (-not $files) {
    throw 'No tracked files found.'
}

$parentSha = $null
try {
    $commits = Invoke-RestMethod -Uri "$apiRoot/commits?sha=$Branch&per_page=1" -Headers $headers
    $commitList = @($commits)
    if ($commitList.Count -gt 0) {
        $parentSha = $commitList[0].sha
    }
}
catch {
    if ([int]$_.Exception.Response.StatusCode -ne 409) {
        throw
    }
}

if (-not $parentSha) {
    $initContent = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("repository initialized`n"))
    $initBody = @{
        message = 'Initialize repository'
        content = $initContent
        branch = $Branch
    } | ConvertTo-Json -Compress
    $init = Invoke-RestMethod -Uri "$apiRoot/contents/.gitkeep" -Method Put -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $initBody
    $parentSha = $init.commit.sha
    Write-Output "INITIALIZED $parentSha"
}

$treeItems = New-Object System.Collections.Generic.List[object]
$index = 0
foreach ($relativePath in $files) {
    $index += 1
    $fullPath = Join-Path $root ($relativePath -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        throw "Tracked file not found: $relativePath"
    }
    $bytes = [IO.File]::ReadAllBytes($fullPath)
    $blobBody = @{
        content = [Convert]::ToBase64String($bytes)
        encoding = 'base64'
    } | ConvertTo-Json -Compress
    $blob = Invoke-RestMethod -Uri "$apiRoot/git/blobs" -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $blobBody
    $treeItems.Add(@{
        path = $relativePath
        mode = '100644'
        type = 'blob'
        sha = $blob.sha
    })
    Write-Output ("BLOB {0}/{1} {2}" -f $index, $files.Count, $relativePath)
}

$treeBody = @{ tree = $treeItems } | ConvertTo-Json -Depth 10 -Compress
$tree = Invoke-RestMethod -Uri "$apiRoot/git/trees" -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $treeBody

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$author = @{
    name = $Owner
    email = "$Owner@users.noreply.github.com"
    date = $timestamp
}
$commitBody = @{
    message = 'Initial commit: personal work-life app v1.0'
    tree = $tree.sha
    parents = @($parentSha)
    author = $author
    committer = $author
} | ConvertTo-Json -Depth 10 -Compress
$commit = Invoke-RestMethod -Uri "$apiRoot/git/commits" -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $commitBody

$refBody = @{
    ref = "refs/heads/$Branch"
    sha = $commit.sha
} | ConvertTo-Json -Compress
try {
    Invoke-RestMethod -Uri "$apiRoot/git/refs" -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $refBody | Out-Null
}
catch {
    if ([int]$_.Exception.Response.StatusCode -eq 422) {
        $updateBody = @{ sha = $commit.sha; force = $false } | ConvertTo-Json -Compress
        Invoke-RestMethod -Uri "$apiRoot/git/refs/heads/$Branch" -Method Patch -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $updateBody | Out-Null
    }
    else {
        throw
    }
}

$repoPatch = @{ default_branch = $Branch } | ConvertTo-Json -Compress
Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repository" -Method Patch -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $repoPatch | Out-Null

$tagBody = @{
    ref = 'refs/tags/v1.0'
    sha = $commit.sha
} | ConvertTo-Json -Compress
try {
    Invoke-RestMethod -Uri "$apiRoot/git/refs" -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $tagBody | Out-Null
}
catch {
    Write-Output 'TAG_SKIPPED_OR_ALREADY_EXISTS'
}

Write-Output "DONE https://github.com/$Owner/$Repository"
Write-Output "COMMIT $($commit.sha)"
Write-Output "FILES $($files.Count)"
