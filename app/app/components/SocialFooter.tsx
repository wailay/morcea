"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTiktok } from "@fortawesome/free-brands-svg-icons";

export function SocialFooter() {
  return (
    <div className="social-footer">
      <a
        href="https://www.instagram.com/morceaa/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
        <FontAwesomeIcon icon={faInstagram} size="2x" />
      </a>
      <a
        href="https://www.tiktok.com/@morceaa"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok"
      >
        <FontAwesomeIcon icon={faTiktok} size="2x" />
      </a>
    </div>
  );
}
