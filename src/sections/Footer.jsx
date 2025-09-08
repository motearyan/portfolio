// import { socialImgs } from "../constants";

// const Footer = () => {
//   return (
//     <footer className="footer">
//       <div className="footer-container">
//         <div className="flex flex-col justify-center">
//           {/* <p>Terms & Conditions</p> */}
//         </div>
//         <div className="socials">
//           {socialImgs.map((socialImg, index) => (
//             <div key={index} className="icon">
//               <img src={socialImg.imgPath} alt="social icon" />
//             </div>
//           ))}
//         </div>
//         <div className="flex flex-col justify-center">
//           <p className="text-center md:text-end">
//             {/* © {new Date().getFullYear()} Adrian Hajdin. All rights reserved. */}
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;


import { socialImgs } from "../constants";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left empty column */}
        <div className="flex flex-col justify-center">
          {/* Empty on purpose */}
        </div>

        {/* Social icons column */}
        <div className="socials flex justify-center gap-6">
          {socialImgs.map((socialImg, index) => (
            <div key={index} className="icon">
              <a
                href={socialImg.url}        // <-- clickable link
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={socialImg.imgPath} alt={socialImg.name} />
              </a>
            </div>
          ))}
        </div>

        {/* Right empty column */}
        <div className="flex flex-col justify-center">
          {/* Empty on purpose */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
