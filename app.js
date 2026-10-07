const fs = require("fs/promises");

(async () => {
  const CREATE_FILE = "create a file";
  const DELETE_FILE = "delete a file";
  const RENAME_FILE = "rename the file";
  const ADD_TO_FILE = "add to the file";

  const createFile = async (path) => {
    try {
      //we want to check if the file already exists, if it does we will return a message
      const newFileHandle = await fs.open(path, "wx");
      console.log("File created successfully");
      newFileHandle.close();
    } catch (e) {
      //file already exists
      console.log("File already exists");
    }
  };

  const deleteFile = async (path) => {
    try {
      await fs.unlink(path);
      console.log("File deleted successfully");
    } catch (e) {
      if (e.code === "ENOENT") {
        console.log("File does not exist");
      } else {
        console.log("An error occurred while deleting the file");
        console.error(e);
      }
    }
  };

  const renameFile = async (oldPath, newPath) => {
    try {
      await fs.rename(oldPath, newPath);
      console.log("File renamed successfully");
    } catch (e) {
      if (e.code === "ENOENT") {
        console.log(
          "No file at this path to rename, or the new path is invalid",
        );
      } else {
        console.log("An error occurred while renaming the file");
        console.error(e);
      }
    }
  };

  let addedContent;

  const addToFile = async (path, content) => {
    if (addedContent === content) return;
    addedContent = content;
    try {
      const fileHandle = await fs.open(path, "a");
      await fileHandle.write(content);
      console.log("Content added successfully");
    } catch (e) {
      console.log("File does not exist");
      console.log(e);
    }
  };
  //commands
  const commandFileHandle = await fs.open("./command.txt", "r");

  commandFileHandle.on("change", async () => {
    //get the size of the file
    const { size } = await commandFileHandle.stat();
    //allocate a buffer of the size of the file
    const buff = Buffer.alloc(size);
    // the location at which we want to start filling our buffer
    const offset = 0;
    // how many bytes we want to read
    const length = buff.byteLength;
    // the position in the file from which we want to start reading
    const position = 0;

    // we always want to read the whole content of the file
    await commandFileHandle.read(buff, offset, length, position);

    //decoder 01 => meaningful
    //encoder meaningful => 01
    const command = buff.toString(); // utf-8 encoding by default
    //create a file
    if (command.includes(CREATE_FILE)) {
      const filePath = command.substring(CREATE_FILE.length + 1);
      createFile(filePath);
    }
    //delete a file
    if (command.includes(DELETE_FILE)) {
      const filePath = command.substring(DELETE_FILE.length + 1);
      deleteFile(filePath);
    }
    //rename a file
    //rename the file <path> to <new path>
    if (command.includes(RENAME_FILE)) {
      const [oldPath, newPath] = command
        .substring(RENAME_FILE.length + 1)
        .split(" to ");
      renameFile(oldPath, newPath);
    }
    //add to a file
    //add to the file <path> this content: <content>
    if (command.includes(ADD_TO_FILE)) {
      const [filePath, content] = command
        .substring(ADD_TO_FILE.length + 1)
        .split(" this content: ");
      addToFile(filePath, content);
    }
  });

  const watcher = fs.watch("./command.txt");
  //prevent mutiple save
  let timeout;
  for await (const event of watcher) {
    if (event.eventType === "change") {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        commandFileHandle.emit("change");
      }, 100);
    }
  }
})();
