import React from "react";
import "../App.css";

const highlights = [
  {
    title: "Multi-model screening",
    description:
      "Run focused prediction flows for heart disease, diabetes, breast cancer, and lung cancer from one interface.",
  },
  {
    title: "Report-ready output",
    description:
      "Generate downloadable PDF summaries that keep prediction results easy to review and share.",
  },
  {
    title: "Clinical data support",
    description:
      "Use manual inputs, prescription uploads, or medical images depending on the selected predictor.",
  },
  {
    title: "Secure access",
    description:
      "Authentication protects prediction tools and keeps user sessions scoped to the current account.",
  },
];

function AboutPage() {
  return (
    <section className="our__team">
      <div className="container">
        <div className="team__content">
          <h6 className="subtitle">About SynapX</h6>
          <h2>
            Intelligent <span className="highlight">Health Screening</span>
          </h2>
          <p className="description">
            SynapX brings machine learning based disease prediction into a
            simple web experience for quick demonstrations, assisted screening,
            and report generation.
          </p>
        </div>
        <div className="team__wrapper">
          {highlights.map((item) => (
            <div className="team__item" key={item.title}>
              <div className="team__details">
                <h4>{item.title}</h4>
                <p className="description">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutPage;
