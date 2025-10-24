import varahi from '../../assets/Events/varahi.jpg';
import prestressing from '../../assets/Events/prestressing.jpg';
import geoinnovate from '../../assets/Events/geoinnovate/geoinnovate.jpg';
import stability from '../../assets/Events/stability/stability.jpg';
import lhcd from '../../assets/Events/LHCD/LHCD.jpg';
import inaugural from '../../assets/Events/inaugural/inaugural.jpg';
import riskitright from '../../assets/Events/riskitright/riskitright.jpeg';
import catapult from '../../assets/Events/catapult/catapult.jpeg';
import techsite from '../../assets/Events/tech-sitevisit/tech-sitevisit.jpeg';
import civilsaga from '../../assets/Events/civilsaga/civilsaga.png';

export const eventsData = [
  {
    id: "10",
    title: "the civil saga",
    date: "27th September, 2025",
    time: "Completed",
    description: `Civil Saga 2025 wrapped up with an action-packed showdown where teams battled through smart planning, speed, and creativity! Top teams proved their engineering excellence and were crowned the champions. A big shout-out to all participants for making the event a thrilling success!`,
    image: civilsaga, 
    venue: "Pavillion",
    mode: "Offline",
    resources: [
      // { 
      //   title: 'LinkedIn Post', 
      //   url: '' // add URL if available
      // }
    ]
},
{
    id: "9",
    title: "Risk It Right!",
    date: "12th August, 2025",
    time: "Completed",
    description: ` PACE hosted its first promotional event of the year, Risk It Right, an exciting quiz that brought together 30+ enthusiastic participants from across branches at NITK.

In teams of three, students competed through multiple rounds that tested not only their civil engineering knowledge, but also their grasp on current affairs, fun riddles, and quick-thinking challenges.

After an engaging evening filled with strategy, teamwork, and laughter, one team emerged as the winners, taking home the prize and the title of the very first Risk It Right Champions! 🏆 

`,
    image: riskitright, 
    venue: "ATB Seminar Hall",
    mode: "Team",
    resources: [
      { 
        title: 'LinkedIn Post', 
        url: 'https://www.linkedin.com/feed/update/urn:li:activity:7365675231824240640/'
      }
    ]
},
{
  id: "8",
  title: "Agro-Engineering Innovation Site Visit",
  date: "March 2025",
  time: "Completed",
  description: "Civil Engineering students had the unique opportunity to visit the 10-acre green sanctuary of NITK alumnus Mr. Chandrakantha Rao Inna (1983 batch). The visit showcased sustainable land management, integration of engineering principles in farming, and the importance of giving back to society. Students explored thriving ecosystems, structural innovations in wooden architecture, and gained inspiring insights on combining knowledge with purpose.",
  image: techsite, 
  venue: "",
  mode: "Offline",
  resources: [
    { 
      title: 'LinkedIn Post', 
      url: 'https://www.linkedin.com/posts/pace-nitk_why-nitk-has-such-a-strong-alumni-foundation-activity-7325774275682979840-Rf5M?utm_source=share&utm_medium=member_desktop&rcm=ACoAADzc7cABUoy-XnZTFvCFrik_hcfItG4Eej8' 
    }
  ]
}
,
  {
    id: "7",
    title: "THE ULTIMATE CATAPULT CHALLENGE",
    date: "17th March, 2025",
    time: "Completed",
    description: `Teams of future civil engineers competed in the PACE Catapult Challenge, designing and building miniature catapults using sticks and rubber bands. 
The event tested creativity, structural stability, and launch accuracy. The winning team, 'Geolala', achieved the best throw! 

It was a fun, hands-on experience in problem-solving, teamwork, and engineering innovation.`, 
     image: catapult, 
    venue: "Pavillion",
    mode: "Offline",
    resources: [
      { 
        title: 'LinkedIn Post', 
        url: 'https://www.linkedin.com/posts/pace-nitk_ready-aim-fire-%F0%9D%97%A7%F0%9D%97%B5%F0%9D%97%B2-%F0%9D%97%A3%F0%9D%97%94%F0%9D%97%96%F0%9D%97%98-%F0%9D%97%96%F0%9D%97%AE%F0%9D%98%81%F0%9D%97%AE%F0%9D%97%BD%F0%9D%98%82%F0%9D%97%B9%F0%9D%98%81-activity-7308815771386753024-Usls?utm_source=share&utm_medium=member_desktop&rcm=ACoAADzc7cABUoy-XnZTFvCFrik_hcfItG4Eej8' 
      }
    ]
  },
  {
    id: "6",
    title: "Workshop - GeoInnovate: Pioneering Sustainable Geotextile Solutions",
    date: "14th March, 2025",
    time: "Completed",
    description: "An insightful workshop led by Prof. Sreevalsa K. covering the fundamentals of geotextiles and their role in sustainable construction. Participants will learn about soil stabilization techniques using eco-friendly materials, explore real-world case studies on geotextile applications in infrastructure projects, gain insights into advanced testing methods and performance evaluation, and engage in an interactive Q&A session with the professor.",
    image: geoinnovate,
    venue: "ISTE Seminar Hall (MB)",
    mode: "Offline",
    resources: [
      { 
        title: 'LinkedIn Post', 
        url: 'https://www.linkedin.com/posts/pace-nitk_%F0%9D%97%98%F0%9D%97%BB%F0%9D%97%B4%F0%9D%97%B6%F0%9D%97%BB%F0%9D%97%B2%F0%9D%97%B2%F0%9D%97%BF%F0%9D%97%B6%F0%9D%97%BB%F0%9D%97%B4-%F0%9D%97%A6%F0%9D%98%82%F0%9D%98%80%F0%9D%98%81%F0%9D%97%AE%F0%9D%97%B6%F0%9D%97%BB%F0%9D%97%AE%F0%9D%97%AF-activity-7306289755606945794-wxUW?utm_source=share&utm_medium=member_desktop&rcm=ACoAADzc7cABUoy-XnZTFvCFrik_hcfItG4Eej8' 
      }
    ]
  },
  {
      id: "5",
      title: "Workshop - Stability of Industrial Racks by Vijay Sir",
      date: "5th March, 2025",
      time: "Completed",
      description: "Learn the fundamentals of industrial rack stability and failure modes, understand design considerations for safe and efficient storage systems, explore real-world case studies and best practices, get insights into GBTUL and CUFSM tools, and engage in an interactive Q&A session with Vijay Sir.",
      image: stability,
      venue: "ISTE Seminar Hall",
      mode: "Offline",
      resources: [
        { 
          title: 'LinkedIn Post', 
          url: 'https://www.linkedin.com/posts/pace-nitk_%F0%9D%97%A8%F0%9D%97%BB%F0%9D%97%B9%F0%9D%97%BC%F0%9D%97%B0%F0%9D%97%B8%F0%9D%97%B6%F0%9D%97%BB%F0%9D%97%B4-%F0%9D%98%81%F0%9D%97%B5%F0%9D%97%B2-%F0%9D%97%A3%F0%9D%97%BC%F0%9D%98%81%F0%9D%97%B2%F0%9D%97%BB%F0%9D%98%81%F0%9D%97%B6%F0%9D%97%AE%F0%9D%97%B9-activity-7305603675689779201-yCFw?utm_source=share&utm_medium=member_desktop&rcm=ACoAADzc7cABUoy-XnZTFvCFrik_hcfItG4Eej8' 
        }
      ]
    },
    {
    id: "4",
    title: "Varahi Underground Power House (VUPH) Site Visit",
    date: "1st March, 2025",
    time: "Completed",
    description: `52 Civil Engineering students from NITK, guided by Asst. Prof. Vinoth Srinivasan, embarked on a 114 km journey to explore the Varahi Underground Hydro-electric Project, a remarkable feat of engineering deep inside the Western Ghats.

    The visit provided insights into the structural and geotechnical marvels of the powerhouse, which is carved into Granitic Gneiss, a naturally stable rock requiring minimal reinforcement. Key engineering highlights included:

    700m-long tunnel leading to the underground facility, EOT cranes (150-tonne capacity) designed for safe turbine maintenance
    Reinforced arched tunnels (8-10m tall, 10m wide) for durability, Advanced hydraulic systems ensuring efficient water flow to turbines.

    The visit offered a hands-on experience of tunnel stability, hydro-mechanical systems, and power infrastructure, showcasing sustainable energy solutions.

    A special thanks to the Varahi Project team for their hospitality and expertise, making this a valuable real-world learning experience.`,

    image: varahi,
    venue: "VUPH",
    Sites: "Varahi Dam",
    mode: "Offline",
    resources: [
      { 
        title: 'LinkedIn Post', 
        url: 'https://www.linkedin.com/posts/pace-nitk_pace-nitk-civilengineering-activity-7303001973719539713-5rYr?utm_source=share&utm_medium=member_desktop&rcm=ACoAADzc7cABUoy-XnZTFvCFrik_hcfItG4Eej8' 
      }
    ]
  
  },
  {
    id: "3",
    title: "Prestressing Yard Site Visit",
    date: "February 5th, 2025",
    time: "Completed",
    description:`PACE Club organized an educational visit to the prestressing yard at BC Road, where students gained invaluable insights into prestressed concrete technology in action. The visit showcased:

     • Advanced tensioning equipment for both pre-tensioning and post-tensioning applications \n
     • Quality control procedures ensuring precise stress levels in steel tendons \n
     • Concrete batching and casting processes for high-strength structural elements \n
     • Real-time demonstration of anchorage systems and stress transfer mechanisms  \n

    Students observed the entire workflow from tendon preparation to final curing of prestressed elements, with industry experts explaining each step's critical parameters and engineering considerations.
    
    The experience bridged theoretical knowledge from classrooms with practical industrial applications, highlighting the importance of precision engineering in prestressed concrete construction. Many students noted how the visit clarified complex concepts taught in structural design courses.
    
    We extend our gratitude to the yard management and technical staff for their detailed explanations and willingness to address students' questions about this specialized field of construction technology.`,
    image: "",
    venue: "BC Road",
    mode: "Offline",
    image: prestressing,
    venue: "BC Road",
    mode: "Offline",
    resources: [
      { 
        title: 'LinkedIn Post', 
        url: 'https://www.linkedin.com/posts/pace-nitk_civilengineering-infrastructure-construction-activity-7302352916474994689-vZg8?utm_source=share&utm_medium=member_desktop&rcm=ACoAADzc7cABUoy-XnZTFvCFrik_hcfItG4Eej8' 
      }
    ]
  },
  {
      id: "2",
      title: "LHC D Site Visit",
      // date: "April 10-12, 2025",
      time: "Completed",
      description: ``,
      image: lhcd,
      venue: "LHC D",
      mode: "Offline",
    },
    {
        id: "1",
        title: "Inaugural Meet",
        // date: "April 10-12, 2025",
        time: "Completed",
        description: `We recently held our first full-club meet, where 100+ students came together to kickstart this initiative! The event featured exciting discussions, team introductions, and goal-setting for the semester. 
        Our team shared the vision for the club, and our new members got a glimpse of the ambitious projects ahead.`,
        image: inaugural,
        // venue: ,
        mode: "Offline",
        resources: [
          { 
            title: 'LinkedIn Post', 
            url: 'https://www.linkedin.com/posts/pace-nitk_civilengineering-engineeringinnovation-handsonlearning-activity-7296950328929787905--pNz?utm_source=share&utm_medium=member_desktop&rcm=ACoAADzc7cABUoy-XnZTFvCFrik_hcfItG4Eej8' 
          }
        ]

        
      },
      
];
