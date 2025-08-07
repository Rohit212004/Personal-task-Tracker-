import React from 'react'
  
function Header() {
    return (
      <div>
        <nav className="nav">
          <div className="nav-left">
            <h1>
               Personal Task Tracker
            </h1>
          </div>
            <div className="nav-right">
              <ul>
              
              <a href="/home" id ="link">Home</a>
              <a href="/todo" id ="link">Todo</a>
              <a href="/members" id ="link">Members</a>
              </ul>  
            </div>
        </nav>
      </div>
    );
}
  
export default Header;