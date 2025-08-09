import React, { useState } from "react";
  
const Todo = () => {
 const [showForm, setshowform] = useState(true);
 const [showNew, setshowNew] = useState(true);
 const [showDelete, setshowDelete] = useState(true);
 const [toggleSubmit, settoggleSubmit] = useState(true);
 const [isEditItem, setisEditItem] = useState(null);
 const [showList, setshowList] = useState(true);
 const [editMessage, seteditMessage] = useState(false);
 const [deleteMessage, setdeleteMessage] = useState(false);
 const [deleteMessagesuccess, setdeleteMessagesuccess] = useState(false);
 const [inputTitle, setinputTitle] = useState("");
 const [inputDesc, setinputDesc] = useState("");
 const [items, setitems] = useState([
   {
     id: "001",
     name: "Default Task",
     desc: "Default Description",
     status: false,
   },
 ]);
  
 //   HANDLING INPUT FIELDS
 const handleInput = (e) => {
   setinputTitle(e.target.value);
 };
 const handleInputdesc = (e) => {
   setinputDesc(e.target.value);
 };
 //   HANDLING INPUT FIELDS
  
 //   SUBMITTING FORM
 const handleSubmit = (e) => {
   setshowList(true);
   setshowNew(true);
  
   e.preventDefault();
   if (!inputTitle || !inputDesc) {
     alert("fill data");
     showList(false);
   } else if (inputTitle && !toggleSubmit) {
     setitems(
       items.map((elem) => {
         if (elem.id === isEditItem) {
           return { ...elem, name: inputTitle, desc: inputDesc };
         }
         return elem;
       })
     );

     setinputTitle("");
     setinputDesc("");
     settoggleSubmit(true);
     setshowform(false);
     setshowDelete(true);
   } else {
     const allinputTitle = {
       id: new Date().getTime().toString(),
       name: inputTitle,
       desc: inputDesc,
     };
     setitems([allinputTitle, ...items]);
     setinputTitle("");
     setinputDesc("");
     setshowform(false);
   }
 };
 //   SUBMITTING FORM
  
 //   DELETE
 const handleDelete = (index) => {
   console.log(index);
   const updatedItems = items.filter((elem) => {
     return index !== elem.id;
   });
   setdeleteMessage(true);
  
   setTimeout(() => {
     setitems(updatedItems);
     setdeleteMessage(false);
   }, 2000);
   setdeleteMessagesuccess(false);
 };
 //   DELETE
  
 //   EDIT
 const handleEdit = (id) => {
   setshowList(false);
   setshowDelete(false);
   setshowNew(false);
   setshowform(true);
  
   settoggleSubmit(false);
   let newEditItem = items.find((elem) => {
     return elem.id === id;
   });
  setinputTitle(newEditItem.name);
  setinputDesc(newEditItem.desc);
   // setshowDelete(true)
  
   setisEditItem(id);
   console.log(newEditItem);
 };
 //   EDIT
  
 // ADD NEW TASK
 const handleAdd = () => {
   //   alert("hello")
   setshowform(true);
   setshowList(true);
   setshowNew(false);
 };
 // ADD NEW TASK
 return (
   <div className="todo-section">
     {/* Add New Task Button */}
  {/* Add Task button removed as requested */}

     {/* Task Form */}
     {showForm && (
       <div style={{ marginBottom: '2rem' }}>
         <h2 className="todo-title">
           {toggleSubmit ? "Add Task" : "Edit Task"}
         </h2>
         <form onSubmit={handleSubmit} className="todo-form">
           <label htmlFor="title">Title</label>
           <input
             type="text"
             name="title"
             id="title"
             placeholder="Enter task title"
             onChange={handleInput}
             value={inputTitle}
             autoComplete="off"
           />
           <label htmlFor="description">Description</label>
           <input
             type="text"
             name="description"
             id="description"
             placeholder="Enter task description"
             onChange={handleInputdesc}
             value={inputDesc}
             autoComplete="off"
           />
           <button type="submit">
             {toggleSubmit ? "Save Task" : "Update Task"}
           </button>
         </form>
       </div>
     )}

     {/* Task List */}
     {showList && (
       <div className="todo-list">
         {deleteMessage && (
           <p className="text-center text-red-600 font-semibold">Item Deleted Successfully</p>
         )}
         {items.length === 0 && (
           <p className="text-center text-gray-400">No tasks yet. Add a new task to get started!</p>
         )}
         {items.map((elem) => (
           <div className="todo-item" key={elem.id}>
             <div style={{ flex: 1, minWidth: 0 }}>
               <div className="todo-item-title">{elem.name}</div>
               <div className="todo-item-desc">{elem.desc}</div>
             </div>
             <div className="todo-actions">
               <button
                 className="edit-btn"
                 onClick={() => handleEdit(elem.id)}
               >
                 Edit
               </button>
               {showDelete && (
                 <button
                   className="delete-btn"
                   onClick={() => handleDelete(elem.id)}
                 >
                   Delete
                 </button>
               )}
             </div>
           </div>
         ))}
       </div>
     )}
   </div>
 );
};
  
export default Todo;