import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import '../styles/components.css';

const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    description,
    iconColor = 'primary'
}) => {
    return (
        <div className="stat-card fade-in">
            <div className="stat-card-header">
                <div className="stat-card-content">
                    <div className="stat-card-title">{title}</div>
                    <div className="stat-card-value">{value}</div>
                </div>
                <div className={`stat-card-icon ${iconColor}`}>
                    {Icon && <Icon />}
                </div>
            </div>

            {(trend || description) && (
                <div className="stat-card-footer">
                    {trend && (
                        <div className={`stat-card-trend ${trend}`}>
                            {trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
                            <span>{trendValue}</span>
                        </div>
                    )}
                    {description && (
                        <div className="stat-card-description">{description}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatCard;
