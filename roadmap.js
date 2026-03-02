function generateRoadmap() {
  const container = document.getElementById("roadmap-container");
  container.innerHTML = "";

  Object.values(skillsData).flat().forEach(skill => {
    let statusClass = "pending";
    let statusText = "Em progresso";

    if (skill.percent === 100) {
      statusClass = "complete";
      statusText = "Concluído";
    } else if (skill.percent >= 40) {
      statusClass = "progress";
      statusText = "Evoluindo";
    }

    const months = Math.ceil((100 - skill.percent) / 5);

    const step = document.createElement("div");
    step.className = `step ${statusClass}`;

    step.innerHTML = `
      <h4>${skill.name}</h4>
      <p>${skill.percent}% concluído</p>
      <small>${statusText} • ${months > 0 ? `${months} meses restantes` : "Finalizado"}</small>
    `;

    container.appendChild(step);
  });
}
