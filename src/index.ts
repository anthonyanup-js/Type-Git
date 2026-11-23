
if (!process.argv[2]) {
    console.log("Invalid command")
    process.exit(1)
}
import fs, { readFileSync } from "fs"
import path from "path"
import { createHash } from "crypto"
import { deflateSync, inflateSync } from "zlib"
const command: string = process.argv[2]
const args: string[] = process.argv.slice(3)

// function decompress(compressedData:Buffer){
//     const decompressedData:string=inflateSync(compressedData).toString("utf-8")

//     return decompressedData
// }

// function getHeader(decompressedData:string){
//     const [header,_]=decompressedData.split("/0")
//     return header
// }

// function getData(decompressedData:string){
//     const [_,data]=decompressedData.split("/0")
//     return data
// }

switch (command) {

    case "init":
        try {
            const rootFolderPath: string = path.join(process.cwd(), ".typegit")
            if (fs.existsSync(rootFolderPath)) {
                console.log("TypeGit repository already initialized");
                break;
            }
            fs.mkdirSync(path.join(rootFolderPath, "objects"), { recursive: true })

            fs.mkdirSync(path.join(rootFolderPath, "refs/heads"), { recursive: true })

            fs.writeFileSync(path.join(rootFolderPath, "HEAD"), "ref:refs/heads/main\n")

            fs.writeFileSync(path.join(rootFolderPath, "index"), JSON.stringify({}))


            console.log("TypeGit initialized successfully at", path.join(process.cwd(), ".typegit"));
            break


        } catch (error) {
            console.log("error: ", error)
            process.exit(1)
        }

    case "add":

        const rootFolderPath: string = path.join(process.cwd(), ".typegit")
        if (!fs.existsSync(rootFolderPath)) {
            console.log("TypeGit repository not initialized");
            break;
        }


        const addCommandArg: undefined | string = args[0]
        if (!addCommandArg) {
            console.log("Invalid command")
            process.exit(1)
        }
        const paths: string[] = []

        if (addCommandArg === ".") {
            const entries = fs.readdirSync(process.cwd())
            const set = new Set([".typegit", ".git", "node_modules"])
            paths.push(...entries.filter((entry) => !set.has(entry)))
            console.log(paths)
            for (let dataPath of paths) {
                // if(dataPath===".typegit" || dataPath===".git" || dataPath==="node_modules"){
                //                 console.log("found folder",dataPath)

                //     continue
                // }
                const stats = fs.statSync(path.join(process.cwd(), dataPath))
                if (stats.isFile()) {
                    //read file content
                    const contentBuffer = readFileSync(path.join(process.cwd(), dataPath))
                    const headerBuffer = Buffer.from(`blob ${contentBuffer.length}\0`)

                    const hash = createHash("sha256")
                        .update(headerBuffer)
                        .update(contentBuffer)
                        .digest("hex");

                    const [folderName, fileName] = [hash.slice(0, 2), hash.slice(2)]
                    fs.mkdirSync(path.join(rootFolderPath, `objects/${folderName}`), { recursive: true })
                    const compressedData = deflateSync(Buffer.concat([headerBuffer, contentBuffer]))
                    fs.writeFileSync(path.join(rootFolderPath, `objects/${folderName}`, fileName), compressedData)
                    const index = JSON.parse(fs.readFileSync(path.join(rootFolderPath, "index")).toString())
                    //check if the file is same or not and then i guess we should add it like this we can avoide writing into file again
                    index[dataPath] = hash
                    fs.writeFileSync(path.join(rootFolderPath, "index"), JSON.stringify(index))
                    //create blob object
                    //store the blob object in the objects folder
                    //update the index to include this file
                }

                else if (stats.isDirectory()) {
                    const entries = fs.readdirSync(path.join(process.cwd(), dataPath))
                    paths.push(...entries.map((entry) => `${dataPath}/${entry}`))

                }
                //check if the data path is file or folder
                //if its file add the file
                //if its folder recursively add the files

            }
            break
        }
        paths.push(...args)

        if (!paths.length) {
            console.log("Invalid Command2")
            process.exit(1)
        }
        let fileExists = true
        for (let dataPath of paths) {
            if (!fs.existsSync(path.join(process.cwd(), dataPath))) {
                fileExists = false
                console.log(dataPath, "doesnt match any files or directories")
                break
            }
        }
        if (!fileExists) {
            break
        }
        const q: string[] = []

        for (let dataPath of paths) {
            console.log("folder path", path.join(process.cwd(), dataPath))
            const stats = fs.statSync(path.join(process.cwd(), dataPath))
            if (stats.isFile()) {
                //read file content
                const contentBuffer = readFileSync(path.join(process.cwd(), dataPath))
                const headerBuffer = Buffer.from(`blob ${contentBuffer.length}\0`)

                const hash = createHash("sha256")
                    .update(headerBuffer)
                    .update(contentBuffer)
                    .digest("hex");

                const [folderName, fileName] = [hash.slice(0, 2), hash.slice(2)]
                fs.mkdirSync(path.join(rootFolderPath, `objects/${folderName}`), { recursive: true })
                const compressedData = deflateSync(Buffer.concat([headerBuffer, contentBuffer]))
                fs.writeFileSync(path.join(rootFolderPath, `objects/${folderName}`, fileName), compressedData)
                const index = JSON.parse(fs.readFileSync(path.join(rootFolderPath, "index")).toString())
                index[dataPath] = hash
                fs.writeFileSync(path.join(rootFolderPath, "index"), JSON.stringify(index))
                //create blob object
                //store the blob object in the objects folder
                //update the index to include this file
            }

            else if (stats.isDirectory()) {
                const entries = fs.readdirSync(path.join(process.cwd(), dataPath))
                paths.push(...entries.map((entry) => `${dataPath}/${entry}`))

            }
            //check if the data path is file or folder
            //if its file add the file
            //if its folder recursively add the files

        }

        break
    case "commit":
        const dir = path.join(process.cwd(), ".typegit");
        if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
            console.log("no a typegit repository");
        }
        const commitCommandArg: undefined | string = args[0]
        if (!commitCommandArg || commitCommandArg !== "-m") {
            console.log("Invalid Command")
            process.exit(1)
        }
        const message: undefined | string = args[1]

        if (!message) {
            console.log("Commit Message required")
            process.exit(1)
        }
        //creating commeting
        function createTree(){
            const tree:any={}//refine:change the type after wards
            const index:{[key:string]:string}=JSON.parse(fs.readFileSync(path.join(".typegit","index")).toString("utf-8"))

            for(let key in index){
                const value:string=index[key]!
                const [rootFolder,...childFolders]=key.split("/")
                if(typeof rootFolder!=="string"){
                    return
                }
                if(!childFolders.length){
                    tree[rootFolder]=value
                }else{
                    const currTree={}
                    for(let i=0;i<childFolders.length;i++){
                        if(i===childFolders.length-1){

                        }


                    }
                }

            }


        }
        function commit(){
            //create tree object from the index(staging area) and return hash
            const treeHash=createTree()
        }
        console.log("changes commited with message", message)
        break
    case "branch":
        const branchCommandArg: undefined | string = args[0]
        if (!branchCommandArg || branchCommandArg !== "-M") {
            console.log("Invalid Command")
            process.exit(1)
        }
        const branchName: undefined | string = args[1]
        if (!branchName) {
            console.log("Invalid command")
            process.exit(1)
        }
        console.log("Branch Name changed to", branchName)
        break
    case "checkout":

        const checkoutBranchName: undefined | string = args[0]
        if (!checkoutBranchName) {
            console.log('Invalid command')
            process.exit(1)
        }
        console.log("Branch changed to", checkoutBranchName)
        break

    default:
        //print help message here
        console.log('Invalid command')
        process.exit(1)
}

