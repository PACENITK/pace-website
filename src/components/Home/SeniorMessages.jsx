import riyaImg from '../../assets/SeniorMessage/1. riya.jpeg';
import shreyasImg from '../../assets/SeniorMessage/2. shreyas.png';
import subhodeepImg from '../../assets/SeniorMessage/3. subhodeep.jpeg';
import shubhamImg from '../../assets/SeniorMessage/4. shubham.png';
import statsreport from '../../assets/SeniorMessage/stats-report.png';
const SeniorMessages = () => {
  const messages = [
    {
      id: 1,
      name: "Riya Aji",
      imageUrl: riyaImg,
      position: "Convenor",
      batch: "Batch of 2026",
      content: [
        "I'm Riya Aji, Convenor of PACE NITK from the Batch of 2026, and this journey has given me memories, lessons, and friendships that I will cherish forever.",
        "From brainstorming ideas and managing challenges to witnessing every event come alive, every experience taught me leadership, resilience, teamwork, and the importance of believing in people.",
        "Every late-night discussion, every stressful deadline, and every unforgettable moment became worthwhile because of the incredible team I had the privilege to work with. PACE was never just an organization to me — it became a family that constantly inspired me to grow beyond my comfort zone.",
        "Grateful to every team member, volunteer, mentor, and participant who made this journey so meaningful. Thank you for trusting me, supporting me, and making this experience truly special. ❤️",
        "Forever proud to be a part of PACE NITK."
      ]
    },
    {
      id: 2,
      name: "Shreyas",
      imageUrl: shreyasImg,
      position: "Joint Convenor",
      batch: "Batch of 2026",
      content: [
        "Becoming PACE president for me came as a surprise. The inaugural year of the club was filled with good initiatives through the efforts of Mr Likhit as well as the members of our batch. We planned to grow the club including the scale of projects as well as activities in the near future. As the original leaders had additional responsibilities, Rhea, Shubhodeep and myself were given the responsibility of navigating the club this academic year.",
        "Even though we might not have been able to meet all the objectives, it was very good to see the commitment from 3rd years as project mentors to guide the juniors through their projects. I would like to thank all of you in being part of my journey in PACE which gave me the confidence that all you juniors are extremely talented and capable to take the club forward.",
        "By nature I am an introvert and don't necessarily indulge in a lot of conversations. But this club gave me an opportunity to interact with all of you which has helped me grow as a person in all aspects.",
        "As we move forward with the changes in the carriculum( many things I don't fully comprehend), it will be a new challenge for all of you to adapt to the new normal. I wish all you juniors big success in your professional and personal lives. Thank you 👍"
      ]
    },
    {
      id: 3,
      name: "Subhodeep",
      imageUrl: subhodeepImg,
      position: "Chairperson",
      batch: "Batch of 2026",
      content: [
        "Serving as Chairman of PACE NITK across two consecutive terms (2024 - 26) has been a very memorable part of my college journey. More than the title, it was the people, the shared vision, the late-night discussions, the challenges we worked through, and the moments where ideas turned into reality that made this experience so special. I'm incredibly grateful to everyone who believed in PACE and helped shape it into what it is today.",
        "To the incoming core: you're stepping into something with immense potential. Trust each other, dream bigger, embrace the tough moments, and make this journey your own.",
        "Proud to have been a part of building this."
      ]
    },
    {
      id: 4,
      name: "Shubham",
      imageUrl: shubhamImg,
      position: "Secretary",
      batch: "Batch of 2026",
      content: [
        "PACE was more than just a technical club for me; it became a journey filled with learning, trust, teamwork, and personal growth. Being a part of a newly developing club and watching it grow with the combined efforts core members and juniors was truly a memorable experience.",
        "What inspired me the most was the dedication, enthusiasm, and sincerity that every junior brought to each project and activity. Their willingness to learn, collaborate, and put in consistent effort exceeded all my expectations. The supportive environment within the team made every challenge enjoyable and every achievement meaningful.",
        "Serving as a Technical Coordinator not only helped me strengthen my technical and leadership skills but also gave me the opportunity to connect with passionate individuals who shared the same vision of learning. The entire journey at PACE has been incredibly special for me, and I will always be proud to have contributed to such a positive and growing community."
      ]
    }
  ];

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
          Messages from the Batch of 2026
        </h2>
        <img className='w-full' src={statsreport} alt="Stats Report"></img>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
            >
              <div className="mb-8 w-full">
                <img 
                  src={msg.imageUrl} 
                  alt={`${msg.name}'s profile`} 
                  className="w-full h-72 sm:h-80 object-cover object-top rounded-xl shadow-sm border border-gray-100"
                />
              </div>

              <div className="flex-grow space-y-4">
                {msg.content.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed text-justify">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">{msg.name}</h3>
                <p className="text-base font-medium text-blue-600 mt-1">{msg.position}</p>
                <p className="text-sm text-gray-500 mt-0.5">{msg.batch}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SeniorMessages;