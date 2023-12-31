/* eslint-disable no-debugger */
import React, { useEffect, useState } from "react";
import MyModal from "../PopUps/Confirm/Confirm";
import "react-toastify/dist/ReactToastify.css";
import { CreateToast } from "../../App";
import _ from "lodash";
import {
  DELETEDOC,
  GETDOC,
  UPDATEEMAIL,
  SETDOC,
  LOGIN,
  RESETPASSWORD,
  DELETECURRENTUSER,
  GETCOLLECTION,
  decrypt,
  encrypt,
} from "../../server";
import "./Settings.css";
import Input from "../Input/Input";
export default function Settings() {
  const [activePage, setActivePage] = React.useState("Login");
  const [showModal, setShowModal] = React.useState(false);
  const [OldEmail, setOldEmail] = useState("");
  const [OldUser, setOldUser] = useState("");
  const [loginData, setLoginData] = React.useState({
    email: "",
    Password: "",
  });
  const [ActiveUser, setActiveUser] = React.useState("");
  const handleInput = (e) => {
    const { name, value } = e.target;
    setActiveUser((prev) => {
      return { ...prev, [name]: value };
    });
  };

  const SaveData = async (e) => {
    let userToSend = ActiveUser;

    e.preventDefault();
    const Users = await GETCOLLECTION("users");

    const CheckUsername = Users.find((user) => {
      return user.Username === ActiveUser.Username;
    });
    if (CheckUsername) {
      if (ActiveUser.Username !== OldUser) {
        CreateToast("username is taken Or Unchanged.", "error");
      }
      userToSend = { ...ActiveUser, Username: OldUser };
    }
    const CheckEmail = Users.find((user) => {
      return user.email === ActiveUser.email;
    });
    if (CheckEmail) {
      userToSend = { ...userToSend, email: OldEmail };
      if (ActiveUser.email !== OldEmail) {
        CreateToast(" email is taken Or Unchanged", "error");
      }
    } else {
      try {
        await UPDATEEMAIL(ActiveUser.email);
        CreateToast("Data updated", "success");
      } catch (error) {
        CreateToast(error.message, "error");
      }
    }
    UpdateUser(userToSend, true);
    setOldEmail(JSON.parse(sessionStorage.getItem("activeUser")).email);
  };
  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const handlePrimaryAction = async (e) => {
    const deleteDocPromise = DELETEDOC("users", ActiveUser.id);
    const deleteCurrentUserPromise = DELETECURRENTUSER();

    await Promise.all([deleteDocPromise, deleteCurrentUserPromise]);

    setShowModal(false);
    sessionStorage.clear();
    window.location.href = "/";
  };

  useEffect(() => {
    const FetchUser = async () => {
      await GETDOC(
        "users",
        decrypt(JSON.parse(sessionStorage.getItem("activeUser")).id)
      ).then((res) => {
        setActiveUser(res), setOldEmail(res.email), setOldUser(res.Username);
      });
    };
    FetchUser();
  }, []);
  const SendResetEmail = async () => {
    try {
      RESETPASSWORD(ActiveUser.email);
      CreateToast("email has been sent", "success");
    } catch (error) {
      CreateToast(error, "error");
    }
  };
  const signIn = async (e) => {
    CreateToast("logging in", "info");
    e.preventDefault();
    if (loginData.email === ActiveUser.email) {
      try {
        const authUser = await LOGIN(loginData.email, loginData.Password);
        const DBuser = await GETDOC("users", authUser.uid);
        await SETDOC("users", authUser.uid, { ...DBuser, Active: true });
        sessionStorage.setItem(
          "activeUser",
          JSON.stringify({ ...DBuser, id: encrypt(DBuser.id) })
        );
        setActivePage("General");
      } catch (error) {
        if (error.message.includes("auth/user-not-found")) {
          CreateToast("no such user", "error");
        } else if (error.message.includes("invalid-email")) {
          CreateToast("invalid Email", "error");
        } else if (error.message.includes("missing-password")) {
          CreateToast("Password cant be empty", "error");
        } else if (error.message.includes("auth/wrong-password")) {
          CreateToast(
            "Wrong Password if you forgot it, try resetting it",
            "error"
          );
        } else {
          CreateToast(error.message, "error");
        }
      }
    } else {
      CreateToast("email doesn't match the signed in one", "error");
    }
  };
  const UpdateInput = (event) => {
    const { name, value } = event.target;
    setLoginData((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };
  const UpdateUser = async (targetUser, popups) => {
    try {
      await SETDOC("users", targetUser.id, { ...targetUser });
      sessionStorage.setItem(
        "activeUser",
        JSON.stringify({ ...targetUser, id: encrypt(targetUser.id) })
      );
      popups
        ? CreateToast("your changes have been saved", "success", 3000)
        : "";
    } catch (error) {
      popups ? CreateToast(error, "error", 3000) : "";
    }
  };
  return (
    <>
      {activePage === "Login" ? (
        <div className="Portal">
          <h3> please login once more </h3>
          <form className="animate__animated animate__fadeInDown">
            <Input
              label="Email"
              type="email"
              required={true}
              id="email"
              name="email"
              value={loginData.email}
              onChangeFunction={UpdateInput}
            />
            <Input
              label="Password"
              type="password"
              required={true}
              id="Password"
              name="Password"
              value={loginData.Password}
              onChangeFunction={UpdateInput}
            />

            <input
              type="submit"
              value="login"
              className="Button"
              onClick={signIn}
            ></input>
          </form>
        </div>
      ) : (
        <div className="Settings">
          <div className="SideBar">
            <ul className="BTNList">
              <li>
                <p
                  onClick={() => setActivePage("General")}
                  className={activePage === "General" ? "focus  Link" : " Link"}
                >
                  General Info
                </p>
              </li>
              <li>
                <p
                  onClick={() => setActivePage("Privacy")}
                  className={activePage === "Privacy" ? "focus Link" : " Link"}
                >
                  Privacy
                </p>
              </li>
            </ul>
          </div>
          <div className="Main">
            {activePage === "General" ? (
              <div className="General">
                <h1>General info</h1>
                <form>
                  <Input
                    label="First Name"
                    type="text"
                    id="Fname"
                    name="Fname"
                    value={ActiveUser.Fname}
                    startWithContent={ActiveUser.Fname}
                    onChangeFunction={handleInput}
                  />

                  <Input
                    label="Last Name"
                    type="text"
                    id="Lname"
                    name="Lname"
                    value={ActiveUser.Lname}
                    startWithContent={ActiveUser.Lname}
                    onChangeFunction={handleInput}
                  />

                  <Input
                    label="Username"
                    type="text"
                    id="Username"
                    name="Username"
                    value={ActiveUser.Username}
                    startWithContent={ActiveUser.Username}
                    onChangeFunction={handleInput}
                  />
                  <Input
                    startWithContent={ActiveUser.phone}
                    label="Phone Number"
                    type="tel"
                    id="phone"
                    name="phone"
                    value={ActiveUser.phone}
                    onChangeFunction={handleInput}
                  />
                  <Input
                    startWithContent={ActiveUser.email}
                    label="Email"
                    type="email"
                    id="email"
                    name="email"
                    value={ActiveUser.email}
                    onChangeFunction={handleInput}
                  />

                  <div id="Gender">
                    <label htmlFor="gender">Gender:</label>
                    <select
                      id="gender"
                      name="gender"
                      defaultValue={ActiveUser.gender}
                      onChange={handleInput}
                    >
                      <option value="" disabled>
                        Select your gender
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div id="DOB">
                    <label htmlFor="birthdate">Date of Birth:</label>
                    <input
                      type="date"
                      id="birthdate"
                      name="dateOfBirth"
                      value={ActiveUser.dateOfBirth}
                      onChange={handleInput}
                    />
                  </div>
                  <input
                    id="Save"
                    type="submit"
                    onClick={(e) => {
                      SaveData(e);
                    }}
                    className="Button"
                    value="Save"
                    style={{ margin: "auto", width: "50%" }}
                  />
                </form>
              </div>
            ) : (
              ""
            )}
            {activePage === "Privacy" ? (
              <div className="Privacy">
                <div className="Button-Wrapper">
                  <button className="btn btn-primary" onClick={SendResetEmail}>
                    Change Password
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleShowModal}
                    style={{ margin: "auto" }}
                  >
                    delete Account
                  </button>
                  <MyModal
                    className="Confirm"
                    show={showModal}
                    handleClose={handleCloseModal}
                    title="Delete Account"
                    primaryButtonText="Delete my account"
                    handlePrimaryAction={handlePrimaryAction}
                  >
                    <>
                      <p style={{ textAlign: "center" }}>
                        are you sure you want to delete your account? this
                        action can not be undone
                      </p>
                    </>
                  </MyModal>
                </div>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      )}
    </>
  );
}
