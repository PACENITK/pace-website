import FA from '../../assets/Team/FA.jpeg';
import HOD from '../../assets/Team/hod.jpg';
import Convenor from '../../assets/Team/convenor.jpeg';

const teamData = {
    leadership: [
      {
        name: "Dr. Basavaraju Manu",
        role: "Head of Department",
        socialLinks: {
          linkedin: "https://www.linkedin.com/in/basavaraju-manu-5708b899/?originalSubdomain=in",
          // twitter: "https://twitter.com",
          googleScholar: "https://scholar.google.co.in/citations?user=MI5BPHwAAAAJ&hl=en"
        },
        imageSrc: HOD
      },
      {
        name: "Dr. Vinoth Srivinivasan",
        role: "Faculty Advisor",
        socialLinks: {
          linkedin: "https://www.linkedin.com/in/dr-svinoth/?originalSubdomain=in",
          // instagram: "https://instagram.com",
          googleScholar: "https://scholar.google.com.sg/citations?hl=en&user=fhEQLNIAAAAJ"
        },
        imageSrc: FA
      }
    ],
    
    convenor: {
      name: "Likith M",
      role: "Convenor",
      socialLinks: {
        linkedin: "https://www.linkedin.com/in/likithm29/",
        // twitter: "https://twitter.com",
        instagram: "https://www.instagram.com/likith_m.0_0/",
      },
      imageSrc: Convenor
    },
    
    // coreTeam: [
    //   {
    //     name: "Sarah Wilson",
    //     role: "Core Member",
    //     socialLinks: {
    //       linkedin: "https://linkedin.com",
    //       instagram: "https://instagram.com",
    //     },
    //     imageSrc: "/images/team/sarah.jpg"
    //   },
    //   {
    //     name: "Mike Brown",
    //     role: "Core Member",
    //     socialLinks: {
    //       linkedin: "https://linkedin.com",
    //       twitter: "https://twitter.com",
    //     },
    //     imageSrc: "/images/team/mike.jpg"
    //   }
    // ]
  };
  
  export default teamData;