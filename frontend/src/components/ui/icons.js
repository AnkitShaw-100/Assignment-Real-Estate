import { createElement } from 'react';
import * as Pi from 'react-icons/pi';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';

/**
 * The app's icon set: Phosphor (regular weight) via react-icons, exported
 * under the names components already use, so swapping the set later is a
 * one-file change. Icons size from CSS (`className="size-4"`); color is
 * currentColor.
 *
 * Phosphor glyphs are filled shapes, so a `strokeWidth` prop (a habit from
 * stroke-based sets) would thicken them; the wrapper drops it.
 */
const icon = (Glyph, name) => {
  // eslint-disable-next-line no-unused-vars
  const Icon = ({ strokeWidth, ...props }) => createElement(Glyph, props);
  Icon.displayName = name;
  return Icon;
};

export const ArrowDownRight = icon(Pi.PiArrowDownRight, 'ArrowDownRight');
export const ArrowLeft = icon(Pi.PiArrowLeft, 'ArrowLeft');
export const ArrowRight = icon(Pi.PiArrowRight, 'ArrowRight');
export const ArrowUpRight = icon(Pi.PiArrowUpRight, 'ArrowUpRight');
export const Bath = icon(Pi.PiBathtub, 'Bath');
export const BedDouble = icon(Pi.PiBed, 'BedDouble');
export const Building2 = icon(Pi.PiBuildings, 'Building2');
export const CalendarClock = icon(Pi.PiCalendarDots, 'CalendarClock');
export const CalendarDays = icon(Pi.PiCalendarBlank, 'CalendarDays');
export const Check = icon(Pi.PiCheck, 'Check');
export const ChevronDown = icon(Pi.PiCaretDown, 'ChevronDown');
export const ChevronLeft = icon(Pi.PiCaretLeft, 'ChevronLeft');
export const ChevronRight = icon(Pi.PiCaretRight, 'ChevronRight');
export const CircleCheck = icon(Pi.PiCheckCircle, 'CircleCheck');
export const CircleCheckBig = icon(Pi.PiSealCheck, 'CircleCheckBig');
export const Clock = icon(Pi.PiClock, 'Clock');
export const ExternalLink = icon(Pi.PiArrowSquareOut, 'ExternalLink');
export const Eye = icon(Pi.PiEye, 'Eye');
export const EyeOff = icon(Pi.PiEyeSlash, 'EyeOff');
export const Heart = icon(Pi.PiHeart, 'Heart');
export const HeartFill = icon(Pi.PiHeartFill, 'HeartFill');
export const ImagePlus = icon(Pi.PiImage, 'ImagePlus');
export const Images = icon(Pi.PiImages, 'Images');
export const LayoutDashboard = icon(Pi.PiSquaresFour, 'LayoutDashboard');
export const Link2 = icon(Pi.PiLink, 'Link2');
export const LoaderCircle = icon(Pi.PiCircleNotch, 'LoaderCircle');
export const LogOut = icon(Pi.PiSignOut, 'LogOut');
export const Mail = icon(Pi.PiEnvelopeSimple, 'Mail');
export const MapPin = icon(Pi.PiMapPin, 'MapPin');
export const Menu = icon(Pi.PiList, 'Menu');
export const MessageSquare = icon(Pi.PiChatCircle, 'MessageSquare');
export const MessageSquareText = icon(Pi.PiChatCircleText, 'MessageSquareText');
export const Pencil = icon(Pi.PiPencilSimple, 'Pencil');
export const Phone = icon(Pi.PiPhone, 'Phone');
export const Plus = icon(Pi.PiPlus, 'Plus');
export const Ruler = icon(Pi.PiRuler, 'Ruler');
export const Search = icon(Pi.PiMagnifyingGlass, 'Search');
export const SearchX = icon(Pi.PiMagnifyingGlassMinus, 'SearchX');
export const ShieldAlert = icon(Pi.PiShieldWarning, 'ShieldAlert');
export const SlidersHorizontal = icon(Pi.PiSlidersHorizontal, 'SlidersHorizontal');
export const Star = icon(Pi.PiStar, 'Star');
export const StarFill = icon(Pi.PiStarFill, 'StarFill');
export const StickyNote = icon(Pi.PiNote, 'StickyNote');
export const Trash2 = icon(Pi.PiTrash, 'Trash2');
export const UserCheck = icon(Pi.PiUserCheck, 'UserCheck');
export const UserRoundSearch = icon(Pi.PiUserFocus, 'UserRoundSearch');
export const Users = icon(Pi.PiUsers, 'Users');
export const UsersRound = icon(Pi.PiUsersThree, 'UsersRound');
export const X = icon(Pi.PiX, 'X');
// Used by newer sections
export const Quotes = icon(Pi.PiQuotes, 'Quotes');
export const HouseLine = icon(Pi.PiHouseLine, 'HouseLine');
export const Key = icon(Pi.PiKey, 'Key');
export const Handshake = icon(Pi.PiHandshake, 'Handshake');
export const Globe = icon(Pi.PiGlobeHemisphereWest, 'Globe');
// Official brand glyphs (Font Awesome brands) for social links
export const FacebookLogo = icon(FaFacebookF, 'FacebookLogo');
export const InstagramLogo = icon(FaInstagram, 'InstagramLogo');
export const LinkedinLogo = icon(FaLinkedinIn, 'LinkedinLogo');
export const XLogo = icon(FaXTwitter, 'XLogo');
// Amenities, CRM and misc
export const AirVent = icon(Pi.PiFan, 'AirVent');
export const ArrowUpDown = icon(Pi.PiArrowsDownUp, 'ArrowUpDown');
export const Briefcase = icon(Pi.PiBriefcase, 'Briefcase');
export const Building = icon(Pi.PiBuilding, 'Building');
export const Car = icon(Pi.PiCar, 'Car');
export const ConciergeBell = icon(Pi.PiCallBell, 'ConciergeBell');
export const Dumbbell = icon(Pi.PiBarbell, 'Dumbbell');
export const Flame = icon(Pi.PiFire, 'Flame');
export const HousePlug = icon(Pi.PiHouseSimple, 'HousePlug');
export const PlugZap = icon(Pi.PiLightning, 'PlugZap');
export const ShieldCheck = icon(Pi.PiShieldCheck, 'ShieldCheck');
export const Shirt = icon(Pi.PiTShirt, 'Shirt');
export const SquareKanban = icon(Pi.PiKanban, 'SquareKanban');
export const Sunset = icon(Pi.PiSunHorizon, 'Sunset');
export const Trees = icon(Pi.PiTree, 'Trees');
export const Truck = icon(Pi.PiTruck, 'Truck');
export const Waves = icon(Pi.PiWaves, 'Waves');
export const Wifi = icon(Pi.PiWifiHigh, 'Wifi');
