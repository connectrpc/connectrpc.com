// Copyright 2023 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { CSSProperties } from "react";
import Link from "@docusaurus/Link";
import { useThemeConfig } from "@docusaurus/theme-common";
import { useLocation } from "@docusaurus/router";

export default function Logo(props: {
  imageClassName?: string;
  titleClassName?: string;
}) {
  const {
    navbar: {
      title: navbarTitle,
      logo = {
        src: "",
      },
    },
  } = useThemeConfig();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { imageClassName, titleClassName, ...propsRest } = props;
  const { pathname } = useLocation();
  const isDocs = pathname.startsWith("/docs/");
  const subTitle = isDocs ? "Docs" : "";
  const homeDestination = isDocs ? "/docs/introduction" : "/";
  return (
    <Link
      to={homeDestination}
      {...propsRest}
      {...(logo.target && {
        target: logo.target,
      })}
      aria-label={`${navbarTitle} ${subTitle}`}
    >
      {/** Render both logos and let CSS hide to prevent SSR madness */}
      <DocsLogo
        style={{
          display: isDocs ? "block" : "none",
        }}
      />
      <MainLogo
        style={{
          display: isDocs ? "none" : "block",
        }}
      />
    </Link>
  );
}

const MainLogo: React.FC<{ style: CSSProperties }> = ({ style }) => (
  <svg
    width="151"
    height="50"
    viewBox="0 0 1053 348"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M296.98 51.8098L279.47 69.3399C262.181 52.015 240.884 39.2238 217.468 32.1001C194.052 24.9765 169.24 23.7405 145.232 28.502C121.224 33.2635 98.7616 43.8752 79.8366 59.3963C60.9116 74.9173 46.1086 94.8683 36.7402 117.48C27.3718 140.092 23.7274 164.666 26.1301 189.023C28.5328 213.381 36.9083 236.769 50.5141 257.115C64.12 277.46 82.5357 294.134 104.129 305.658C125.721 317.183 149.824 323.201 174.3 323.18V347.97C145.768 347.969 117.677 340.932 92.5145 327.482C67.3519 314.032 45.8948 294.584 30.0435 270.861C14.1922 247.138 4.43612 219.871 1.63933 191.477C-1.15747 163.083 3.09138 134.437 14.0095 108.077C24.9277 81.7172 42.1781 58.4564 64.2329 40.3555C86.2877 22.2546 112.466 9.87225 140.449 4.30497C168.433 -1.26232 197.357 0.157486 224.66 8.43851C251.964 16.7195 276.804 31.6063 296.98 51.7801V51.8098Z"
      fill="#77E1FF"
    />
    <path
      d="M174.3 50.5699C147.01 50.5698 120.484 59.5765 98.8359 76.1922C77.1881 92.808 61.6293 116.104 54.5736 142.465C47.518 168.827 49.3599 196.78 59.8138 221.988C70.2676 247.196 88.7488 268.249 112.39 281.88L124.76 260.42C112.519 253.374 101.924 243.795 93.6849 232.323C85.4458 220.851 79.7525 207.752 76.9861 193.901C74.2196 180.051 74.4439 165.769 77.644 152.013C80.844 138.256 86.9458 125.342 95.5411 114.134C104.136 102.927 115.027 93.6847 127.483 87.0269C139.939 80.3691 153.674 76.4491 167.768 75.5294C181.862 74.6096 195.99 76.7114 209.206 81.6939C222.422 86.6764 234.421 94.4246 244.4 104.42L261.93 86.89C250.436 75.3614 236.778 66.2179 221.739 59.9849C206.701 53.7519 190.579 50.5522 174.3 50.5699Z"
      fill="#77E1FF"
    />
    <path
      d="M261.93 262.12C247.521 276.572 229.769 287.244 210.246 293.19C190.724 299.136 170.037 300.172 150.018 296.205C130 292.239 111.27 283.393 95.4898 270.453C79.7097 257.513 67.3672 240.878 59.5574 222.024C51.7475 203.17 48.7118 182.68 50.7193 162.372C52.7268 142.063 59.7157 122.564 71.0658 105.604C82.4159 88.6441 97.7765 74.7477 115.785 65.1475C133.793 55.5472 153.893 50.5398 174.3 50.5698V25.78C149.842 25.7797 125.762 31.8114 104.192 43.3408C82.6218 54.8702 64.2284 71.5415 50.6406 91.8777C37.0529 112.214 28.6904 135.587 26.2938 159.927C23.8973 184.268 27.5407 208.823 36.9014 231.419C46.2621 254.015 61.051 273.953 79.9581 289.468C98.8653 304.983 121.307 315.595 145.295 320.365C169.284 325.134 194.078 323.914 217.482 316.812C240.886 309.71 262.177 296.946 279.47 279.65L261.93 262.12Z"
      fill="#161EDE"
    />
    <path
      d="M226.87 227.07C212.926 241.014 194.014 248.847 174.295 248.847C154.575 248.847 135.663 241.014 121.72 227.07C107.776 213.126 99.9424 194.214 99.9424 174.495C99.9424 154.775 107.776 135.864 121.72 121.92C126.317 117.308 131.497 113.318 137.13 110.05L124.76 88.5999C112.531 95.651 101.948 105.232 93.7204 116.702C85.4924 128.173 79.8085 141.268 77.0489 155.111C74.2892 168.955 74.5175 183.229 77.7183 196.977C80.9192 210.726 87.0189 223.632 95.6094 234.833C104.2 246.035 115.083 255.272 127.531 261.929C139.98 268.585 153.706 272.507 167.791 273.432C181.877 274.356 195.998 272.262 209.21 267.29C222.421 262.318 234.419 254.582 244.4 244.6L226.87 227.07Z"
      fill="#161EDE"
    />
    <path
      d="M504.87 152.62H485.87C485.234 148.817 483.847 145.18 481.79 141.92C479.849 138.885 477.376 136.225 474.49 134.07C471.58 131.905 468.319 130.258 464.85 129.2C461.193 128.092 457.39 127.539 453.57 127.56C446.76 127.451 440.067 129.331 434.31 132.97C428.411 136.862 423.764 142.377 420.93 148.85C417.663 155.83 416.03 164.35 416.03 174.41C416.03 184.47 417.663 193.026 420.93 200.08C424.19 207.06 428.66 212.333 434.34 215.9C440.08 219.485 446.732 221.342 453.5 221.25C457.302 221.268 461.086 220.725 464.73 219.64C468.191 218.605 471.451 216.988 474.37 214.86C477.262 212.742 479.746 210.116 481.7 207.11C483.769 203.897 485.185 200.309 485.87 196.55L504.87 196.61C503.927 202.539 501.939 208.255 499 213.49C496.15 218.569 492.375 223.069 487.87 226.76C483.253 230.519 478.009 233.434 472.38 235.37C466.26 237.433 459.837 238.447 453.38 238.37C443.239 238.543 433.253 235.876 424.55 230.67C415.948 225.361 409.035 217.713 404.62 208.62C399.773 199.046 397.35 187.63 397.35 174.37C397.35 161.11 399.783 149.68 404.65 140.08C409.103 131.003 416.037 123.375 424.65 118.08C433.333 112.879 443.299 110.212 453.42 110.38C459.707 110.333 465.962 111.288 471.95 113.21C477.56 115.03 482.801 117.834 487.43 121.49C492.034 125.144 495.896 129.645 498.81 134.75C501.915 140.282 503.969 146.34 504.87 152.62Z"
      fill="#090A3A"
    />
    <path
      d="M559.47 238.59C550.71 238.59 543.063 236.59 536.53 232.59C529.961 228.528 524.686 222.68 521.32 215.73C517.706 208.517 515.903 200.083 515.91 190.43C515.916 180.777 517.72 172.3 521.32 165C524.673 158.025 529.95 152.154 536.53 148.08C543.063 144.08 550.71 142.08 559.47 142.08C568.23 142.08 575.873 144.08 582.4 148.08C588.979 152.154 594.257 158.025 597.61 165C601.223 172.26 603.03 180.737 603.03 190.43C603.03 200.123 601.223 208.557 597.61 215.73C594.244 222.68 588.968 228.528 582.4 232.59C575.866 236.59 568.223 238.59 559.47 238.59ZM559.53 223.32C565.21 223.32 569.913 221.82 573.64 218.82C577.472 215.671 580.35 211.515 581.95 206.82C585.55 196.135 585.55 184.565 581.95 173.88C580.347 169.164 577.471 164.983 573.64 161.8C569.906 158.76 565.203 157.24 559.53 157.24C553.856 157.24 549.12 158.76 545.32 161.8C541.475 164.975 538.59 169.158 536.99 173.88C533.376 184.563 533.376 196.137 536.99 206.82C538.585 211.522 541.472 215.681 545.32 218.82C549.066 221.82 553.8 223.32 559.52 223.32H559.53Z"
      fill="#090A3A"
    />
    <path
      d="M635.64 181.18V236.66H617.47V143.22H634.93V158.43H636.09C638.194 153.528 641.724 149.371 646.22 146.5C650.82 143.5 656.63 142 663.65 142C669.477 141.877 675.238 143.255 680.38 146C685.202 148.726 689.073 152.865 691.47 157.86C694.136 163.087 695.47 169.553 695.47 177.26V236.7H677.26V179.45C677.26 172.677 675.493 167.377 671.96 163.55C668.426 159.723 663.596 157.807 657.47 157.8C653.557 157.724 649.691 158.665 646.25 160.53C642.953 162.392 640.268 165.171 638.52 168.53C636.524 172.442 635.534 176.789 635.64 181.18Z"
      fill="#090A3A"
    />
    <path
      d="M735.57 181.18V236.66H717.38V143.22H734.84V158.43H736C738.104 153.528 741.634 149.371 746.13 146.5C750.73 143.5 756.54 142 763.56 142C769.387 141.877 775.148 143.255 780.29 146C785.125 148.714 789.009 152.847 791.42 157.84C794.087 163.066 795.42 169.533 795.42 177.24V236.68H777.23V179.43C777.23 172.657 775.463 167.357 771.93 163.53C768.397 159.703 763.55 157.787 757.39 157.78C753.477 157.704 749.611 158.645 746.17 160.51C742.873 162.372 740.188 165.151 738.44 168.51C736.444 172.429 735.458 176.784 735.57 181.18Z"
      fill="#090A3A"
    />
    <path
      d="M854.159 238.59C844.946 238.59 837.026 236.613 830.4 232.66C823.766 228.699 818.437 222.884 815.069 215.93C811.483 208.73 809.689 200.283 809.689 190.59C809.689 181.023 811.483 172.587 815.069 165.28C818.396 158.278 823.625 152.352 830.159 148.18C836.626 144.087 844.2 142.04 852.88 142.04C858.102 142.03 863.287 142.916 868.209 144.66C873.186 146.419 877.73 149.217 881.539 152.87C885.692 156.945 888.871 161.905 890.839 167.38C893.119 173.32 894.256 180.53 894.25 189.01V195.46H819.969V181.83H876.469C876.551 177.405 875.549 173.028 873.549 169.08C871.678 165.454 868.844 162.413 865.359 160.29C861.636 158.083 857.367 156.967 853.039 157.07C848.316 156.957 843.667 158.259 839.689 160.81C835.967 163.229 832.946 166.585 830.929 170.54C828.875 174.563 827.821 179.023 827.859 183.54V194.18C827.859 200.42 828.963 205.733 831.169 210.12C833.201 214.301 836.432 217.782 840.449 220.12C844.706 222.48 849.514 223.664 854.38 223.55C857.585 223.593 860.774 223.089 863.809 222.06C866.559 221.124 869.071 219.598 871.169 217.59C873.287 215.526 874.911 213.01 875.919 210.23L893.14 213.33C891.809 218.306 889.267 222.876 885.74 226.63C882.019 230.534 877.466 233.549 872.419 235.45C866.584 237.633 860.389 238.699 854.159 238.59Z"
      fill="#090A3A"
    />
    <path
      d="M951.47 238.59C942.43 238.59 934.653 236.53 928.14 232.41C921.606 228.28 916.399 222.358 913.14 215.35C909.53 207.54 907.739 199.012 907.9 190.41C907.9 180.91 909.686 172.523 913.26 165.25C916.58 158.251 921.811 152.334 928.35 148.18C934.83 144.087 942.473 142.04 951.28 142.04C957.825 141.921 964.316 143.26 970.28 145.96C975.636 148.419 980.276 152.205 983.76 156.96C987.238 161.809 989.348 167.505 989.87 173.45H972.17C971.201 169.071 968.869 165.111 965.51 162.14C962.036 158.967 957.403 157.383 951.61 157.39C946.866 157.294 942.213 158.694 938.31 161.39C934.352 164.25 931.285 168.171 929.46 172.7C927.237 178.194 926.162 184.085 926.3 190.01C926.155 196.037 927.209 202.033 929.4 207.65C931.189 212.234 934.235 216.22 938.19 219.15C941.513 221.381 945.341 222.746 949.326 223.124C953.311 223.501 957.327 222.877 961.01 221.31C963.781 220.065 966.218 218.18 968.12 215.81C970.094 213.273 971.463 210.317 972.12 207.17H989.82C989.257 212.977 987.227 218.544 983.92 223.35C980.57 228.155 976.032 232.01 970.75 234.54C964.722 237.362 958.123 238.748 951.47 238.59Z"
      fill="#090A3A"
    />
    <path
      d="M1050.62 143.26V157.86H999.57V143.26H1050.62ZM1013.26 120.87H1031.47V209.27C1031.47 212.79 1032 215.44 1033.05 217.2C1033.96 218.841 1035.41 220.112 1037.16 220.79C1038.92 221.436 1040.79 221.758 1042.67 221.74C1043.95 221.756 1045.24 221.652 1046.5 221.43L1049.05 220.95L1052.34 235.95C1050.87 236.472 1049.37 236.89 1047.84 237.2C1045.44 237.674 1042.99 237.909 1040.54 237.9C1035.95 238.017 1031.38 237.147 1027.15 235.35C1023.09 233.603 1019.62 230.729 1017.15 227.07C1014.6 223.336 1013.33 218.67 1013.32 213.07L1013.26 120.87Z"
      fill="#090A3A"
    />
  </svg>
);

const DocsLogo: React.FC<{ style: CSSProperties }> = ({ style }) => (
  <svg
    width="151"
    height="50"
    viewBox="0 0 1053 348"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M430.62 303.3H401.47V208.75H431.94C441.106 208.75 448.953 210.633 455.48 214.4C461.997 218.171 467.224 223.821 470.48 230.61C473.96 237.643 475.7 246.053 475.7 255.84C475.7 265.627 473.943 274.097 470.43 281.25C467.116 288.136 461.768 293.839 455.11 297.59C448.39 301.39 440.226 303.294 430.62 303.3ZM412.89 293.18H429.89C437.71 293.18 444.186 291.67 449.32 288.65C454.421 285.684 458.448 281.174 460.82 275.77C463.34 270.197 464.603 263.567 464.61 255.88C464.616 248.193 463.37 241.613 460.87 236.14C458.562 230.835 454.657 226.382 449.7 223.4C444.74 220.433 438.566 218.95 431.18 218.95H412.89V293.18Z"
      fill="#090A3A"
    />
    <path
      d="M522.21 304.77C516.343 304.942 510.555 303.388 505.562 300.303C500.569 297.217 496.591 292.734 494.12 287.41C491.327 281.403 489.958 274.833 490.12 268.21C489.956 261.542 491.325 254.926 494.12 248.87C496.636 243.548 500.612 239.05 505.585 235.9C510.558 232.75 516.323 231.078 522.21 231.078C528.097 231.078 533.862 232.75 538.835 235.9C543.809 239.05 547.784 243.548 550.3 248.87C553.095 254.926 554.464 261.542 554.3 268.21C554.462 274.833 553.093 281.403 550.3 287.41C547.83 292.734 543.851 297.217 538.858 300.303C533.866 303.388 528.077 304.942 522.21 304.77ZM522.21 294.99C527.07 294.99 531.07 293.743 534.21 291.25C537.416 288.687 539.84 285.279 541.21 281.41C542.751 277.171 543.517 272.69 543.47 268.18C543.507 263.664 542.738 259.177 541.2 254.93C539.832 251.038 537.408 247.604 534.2 245.01C531.06 242.477 527.06 241.213 522.2 241.22C517.34 241.227 513.34 242.49 510.2 245.01C506.992 247.604 504.568 251.038 503.2 254.93C501.676 259.179 500.92 263.666 500.97 268.18C500.93 272.68 501.699 277.151 503.24 281.38C504.61 285.249 507.035 288.657 510.24 291.22C513.36 293.733 517.35 294.99 522.21 294.99Z"
      fill="#090A3A"
    />
    <path
      d="M599.77 304.77C593.824 305 587.946 303.436 582.9 300.284C577.854 297.131 573.871 292.534 571.47 287.09C568.797 281.161 567.472 274.713 567.59 268.21C567.461 261.626 568.828 255.098 571.59 249.12C574.034 243.834 577.902 239.332 582.76 236.12C587.766 232.931 593.606 231.299 599.54 231.43C604.181 231.361 608.782 232.306 613.02 234.2C616.885 235.939 620.262 238.604 622.85 241.96C625.435 245.349 627.077 249.361 627.61 253.59H616.71C615.794 250.226 613.871 247.222 611.2 244.98C608.347 242.473 604.523 241.22 599.73 241.22C595.761 241.136 591.864 242.289 588.58 244.52C585.28 246.853 582.704 250.069 581.15 253.8C579.288 258.228 578.382 262.998 578.49 267.8C578.381 272.698 579.269 277.566 581.1 282.11C582.624 285.899 585.185 289.181 588.49 291.58C591.787 293.861 595.722 295.041 599.73 294.95C602.374 294.983 604.996 294.48 607.44 293.47C609.692 292.52 611.697 291.066 613.3 289.22C614.94 287.3 616.107 285.022 616.71 282.57H627.61C627.035 286.692 625.446 290.607 622.985 293.963C620.524 297.319 617.268 300.012 613.51 301.8C609.221 303.84 604.518 304.857 599.77 304.77Z"
      fill="#090A3A"
    />
    <path
      d="M693.76 248.27L683.97 251.04C683.304 249.325 682.395 247.716 681.27 246.26C679.977 244.62 678.325 243.299 676.44 242.4C673.991 241.302 671.322 240.782 668.64 240.88C664.81 240.739 661.03 241.787 657.82 243.88C654.94 245.88 653.5 248.397 653.5 251.43C653.456 252.66 653.705 253.882 654.227 254.997C654.748 256.111 655.527 257.086 656.5 257.84C658.5 259.413 661.58 260.723 665.74 261.77L676.26 264.35C682.6 265.89 687.327 268.223 690.44 271.35C691.996 272.961 693.21 274.869 694.011 276.96C694.812 279.051 695.182 281.282 695.1 283.52C695.151 287.433 693.926 291.256 691.61 294.41C689.108 297.756 685.755 300.37 681.9 301.98C677.315 303.912 672.374 304.856 667.4 304.75C660.167 304.75 654.167 303.18 649.4 300.04C647.047 298.477 645.036 296.452 643.489 294.089C641.942 291.725 640.891 289.072 640.4 286.29L650.74 283.7C651.482 287.159 653.481 290.22 656.35 292.29C659.097 294.217 662.703 295.18 667.17 295.18C672.237 295.18 676.273 294.097 679.28 291.93C682.287 289.763 683.787 287.153 683.78 284.1C683.804 282.942 683.588 281.793 683.144 280.723C682.699 279.654 682.037 278.689 681.2 277.89C679.47 276.21 676.83 274.96 673.26 274.13L661.47 271.35C654.977 269.81 650.213 267.417 647.18 264.17C644.125 260.852 642.495 256.468 642.64 251.96C642.581 248.145 643.771 244.415 646.03 241.34C648.432 238.15 651.633 235.649 655.31 234.09C659.527 232.279 664.081 231.383 668.67 231.46C675.69 231.46 681.207 233 685.22 236.08C689.238 239.182 692.217 243.434 693.76 248.27Z"
      fill="#090A3A"
    />
    <path
      d="M296.98 50.9799L279.47 68.5099C262.178 51.1922 240.881 38.4077 217.466 31.2902C194.052 24.1727 169.243 22.9419 145.238 27.7067C121.234 32.4715 98.776 43.0848 79.855 58.6059C60.9339 74.1269 46.1343 94.0764 36.768 116.686C27.4017 139.295 23.758 163.866 26.16 188.22C28.5619 212.575 36.9352 235.961 50.5377 256.305C64.1403 276.649 82.5518 293.323 104.14 304.849C125.729 316.374 149.827 322.396 174.3 322.38V347.18C145.769 347.178 117.68 340.139 92.5186 326.689C67.3575 313.238 45.9017 293.79 30.0515 270.068C14.2014 246.345 4.44603 219.079 1.64949 190.686C-1.14705 162.293 3.10154 133.648 14.019 107.289C24.9364 80.9298 42.1858 57.6697 64.2392 39.5688C86.2927 21.4679 112.47 9.08493 140.452 3.51653C168.434 -2.05186 197.357 -0.63378 224.66 7.6452C251.963 15.9242 276.803 30.8085 296.98 50.9799Z"
      fill="#77E1FF"
    />
    <path
      d="M174.3 49.7401C147.01 49.74 120.484 58.7464 98.8359 75.3622C77.1881 91.9779 61.6293 115.274 54.5736 141.636C47.518 167.997 49.3599 195.95 59.8138 221.158C70.2676 246.366 88.7488 267.419 112.39 281.05L124.76 259.6C117.243 255.242 110.328 249.92 104.19 243.77C94.9834 234.564 87.6806 223.634 82.6982 211.606C77.7157 199.577 75.1513 186.685 75.1513 173.665C75.1513 160.645 77.7157 147.753 82.6982 135.724C87.6806 123.696 94.9834 112.766 104.19 103.56C113.396 94.3536 124.326 87.0509 136.354 82.0685C148.383 77.086 161.275 74.5216 174.295 74.5216C187.314 74.5216 200.207 77.086 212.235 82.0685C224.264 87.0509 235.193 94.3536 244.4 103.56L261.93 86.0401C250.436 74.5139 236.777 65.3731 221.738 59.1434C206.699 52.9138 190.578 49.7182 174.3 49.7401Z"
      fill="#77E1FF"
    />
    <path
      d="M261.93 261.3C247.52 275.749 229.767 286.419 210.246 292.363C190.724 298.307 170.037 299.341 150.02 295.374C130.003 291.406 111.275 282.56 95.4958 269.62C79.717 256.68 67.3757 240.045 59.5666 221.192C51.7574 202.339 48.7219 181.85 50.7292 161.542C52.7364 141.235 59.7245 121.737 71.0736 104.777C82.4226 87.8179 97.7818 73.9216 115.789 64.3208C133.796 54.72 153.894 49.7117 174.3 49.74V24.95C149.842 24.9496 125.762 30.9813 104.192 42.5107C82.6218 54.0402 64.2284 70.7114 50.6406 91.0476C37.0529 111.384 28.6904 134.757 26.2938 159.097C23.8973 183.438 27.5407 207.993 36.9014 230.589C46.2621 253.185 61.051 273.123 79.9581 288.638C98.8653 304.152 121.307 314.765 145.295 319.534C169.284 324.304 194.078 323.084 217.482 315.982C240.886 308.88 262.177 296.116 279.47 278.82L261.93 261.3Z"
      fill="#161EDE"
    />
    <path
      d="M226.87 226.24C219.381 233.707 210.385 239.49 200.483 243.204C190.581 246.917 180.001 248.476 169.449 247.775C158.897 247.075 148.616 244.131 139.292 239.141C129.968 234.151 121.816 227.23 115.379 218.838C108.943 210.447 104.371 200.779 101.969 190.48C99.5659 180.182 99.3879 169.489 101.446 159.116C103.505 148.743 107.753 138.928 113.906 130.327C120.06 121.727 127.977 114.538 137.13 109.24L124.76 87.79C112.531 94.8412 101.948 104.422 93.7204 115.892C85.4924 127.363 79.8085 140.457 77.0489 154.301C74.2892 168.145 74.5175 182.419 77.7183 196.167C80.9192 209.915 87.0189 222.822 95.6094 234.023C104.2 245.224 115.083 254.462 127.531 261.119C139.98 267.775 153.706 271.697 167.791 272.622C181.877 273.546 195.998 271.452 209.21 266.48C222.421 261.508 234.419 253.772 244.4 243.79L226.87 226.24Z"
      fill="#161EDE"
    />
    <path
      d="M504.87 79.47H485.87C485.236 75.6641 483.849 72.023 481.79 68.76C479.85 65.7247 477.377 63.0651 474.49 60.9099C471.582 58.7448 468.32 57.1006 464.85 56.05C461.195 54.9345 457.392 54.378 453.57 54.3999C446.76 54.2968 440.067 56.1802 434.31 59.8198C428.41 63.7095 423.763 69.2253 420.93 75.6999C417.663 82.6666 416.03 91.1833 416.03 101.25C416.03 111.317 417.663 119.873 420.93 126.92C424.19 133.9 428.66 139.173 434.34 142.74C440.081 146.325 446.732 148.182 453.5 148.09C457.303 148.113 461.087 147.57 464.73 146.48C468.191 145.448 471.451 143.835 474.37 141.71C477.263 139.588 479.746 136.959 481.7 133.95C483.771 130.738 485.188 127.15 485.87 123.39L504.87 123.45C503.927 129.383 501.94 135.101 499 140.34C496.147 145.414 492.373 149.911 487.87 153.6C483.254 157.359 478.01 160.274 472.38 162.21C466.262 164.278 459.838 165.292 453.38 165.21C443.239 165.388 433.252 162.721 424.55 157.51C415.955 152.214 409.043 144.585 404.62 135.51C399.773 125.937 397.35 114.52 397.35 101.26C397.35 88 399.783 76.5733 404.65 66.98C409.101 57.9024 416.037 50.2738 424.65 44.98C433.335 39.7821 443.3 37.1184 453.42 37.29C459.708 37.2385 465.964 38.1938 471.95 40.1199C477.561 41.9327 482.804 44.7333 487.43 48.3899C492.034 52.044 495.897 56.5448 498.81 61.6499C501.908 67.1669 503.963 73.208 504.87 79.47Z"
      fill="#090A3A"
    />
    <path
      d="M559.47 165.43C550.71 165.43 543.064 163.43 536.53 159.43C529.963 155.372 524.687 149.527 521.32 142.58C517.707 135.36 515.904 126.923 515.91 117.27C515.917 107.617 517.72 99.1398 521.32 91.8398C524.671 84.8661 529.949 78.9981 536.53 74.9299C543.064 70.9299 550.71 68.9299 559.47 68.9299C568.23 68.9299 575.873 70.9299 582.4 74.9299C588.981 78.9981 594.259 84.8661 597.61 91.8398C601.224 99.0998 603.03 107.577 603.03 117.27C603.03 126.963 601.224 135.4 597.61 142.58C594.244 149.527 588.968 155.372 582.4 159.43C575.867 163.437 568.224 165.437 559.47 165.43ZM559.53 150.16C565.21 150.16 569.913 148.66 573.64 145.66C577.473 142.511 580.351 138.355 581.95 133.66C585.55 122.975 585.55 111.405 581.95 100.72C580.343 96.0062 577.468 91.8265 573.64 88.6399C569.907 85.5999 565.204 84.0798 559.53 84.0798C553.857 84.0798 549.12 85.5999 545.32 88.6399C541.478 91.8168 538.594 95.9992 536.99 100.72C533.377 111.403 533.377 122.977 536.99 133.66C538.586 138.362 541.472 142.521 545.32 145.66C549.067 148.673 553.8 150.18 559.52 150.18L559.53 150.16Z"
      fill="#090A3A"
    />
    <path
      d="M635.64 108.06V163.55H617.47V70.0998H634.93V85.3098H636.09C638.197 80.4092 641.726 76.2535 646.22 73.3798C650.82 70.3798 656.63 68.8798 663.65 68.8798C669.477 68.7531 675.24 70.1307 680.38 72.8798C685.198 75.5937 689.068 79.719 691.47 84.6999C694.136 89.9266 695.47 96.3965 695.47 104.11V163.55H677.26V106.3C677.26 99.52 675.493 94.2165 671.96 90.3899C668.426 86.5632 663.596 84.6465 657.47 84.6399C653.555 84.5628 649.688 85.5071 646.25 87.3798C642.949 89.2366 640.262 92.0171 638.52 95.3798C636.517 99.3001 635.527 103.659 635.64 108.06Z"
      fill="#090A3A"
    />
    <path
      d="M735.57 108.06V163.55H717.38V70.0998H734.84V85.3098H736C738.107 80.4092 741.636 76.2535 746.13 73.3798C750.73 70.3798 756.54 68.8798 763.56 68.8798C769.388 68.7531 775.15 70.1307 780.29 72.8798C785.124 75.5899 789.009 79.7195 791.42 84.7099C794.087 89.9366 795.42 96.4065 795.42 104.12V163.56H777.23V106.31C777.23 99.5298 775.463 94.2265 771.93 90.3999C768.397 86.5732 763.55 84.6565 757.39 84.6499C753.475 84.5728 749.608 85.5171 746.17 87.3899C742.869 89.2466 740.182 92.0271 738.44 95.3899C736.442 99.3081 735.456 103.663 735.57 108.06Z"
      fill="#090A3A"
    />
    <path
      d="M854.16 165.43C844.947 165.43 837.027 163.453 830.4 159.5C823.764 155.542 818.434 149.726 815.07 142.77C811.483 135.57 809.69 127.123 809.69 117.43C809.69 107.857 811.483 99.42 815.07 92.12C818.394 85.1185 823.624 79.1956 830.16 75.0301C836.627 70.9301 844.2 68.88 852.88 68.88C858.102 68.8702 863.287 69.7565 868.21 71.5001C873.186 73.2588 877.73 76.0576 881.54 79.71C885.693 83.7851 888.872 88.7451 890.84 94.2201C893.12 100.16 894.257 107.37 894.25 115.85V122.3H819.97V108.67H876.47C876.549 104.246 875.547 99.8688 873.55 95.92C871.678 92.2941 868.845 89.2531 865.36 87.13C861.636 84.9231 857.367 83.8073 853.04 83.91C848.317 83.8018 843.669 85.1039 839.69 87.65C835.969 90.0714 832.949 93.4263 830.93 97.38C828.875 101.403 827.822 105.863 827.86 110.38V121.03C827.86 127.283 828.963 132.597 831.17 136.97C833.198 141.153 836.43 144.635 840.45 146.97C844.705 149.333 849.514 150.521 854.38 150.41C857.586 150.449 860.775 149.942 863.81 148.91C866.56 147.974 869.071 146.448 871.17 144.44C873.29 142.378 874.914 139.861 875.92 137.08L893.14 140.18C891.814 145.158 889.271 149.729 885.74 153.48C882.019 157.384 877.466 160.399 872.42 162.3C866.584 164.48 860.389 165.542 854.16 165.43Z"
      fill="#090A3A"
    />
    <path
      d="M951.47 165.43C942.43 165.43 934.653 163.373 928.14 159.26C921.608 155.124 916.402 149.199 913.14 142.19C909.529 134.38 907.738 125.853 907.9 117.25C907.9 107.757 909.686 99.3699 913.26 92.0899C916.578 85.0922 921.809 79.1775 928.35 75.0301C934.83 70.9301 942.473 68.88 951.28 68.88C957.827 68.7599 964.318 70.1024 970.28 72.8099C975.64 75.2624 980.282 79.05 983.76 83.8099C987.239 88.6548 989.35 94.3477 989.87 100.29H972.17C971.201 95.911 968.869 91.9515 965.51 88.9801C962.036 85.8067 957.403 84.2234 951.61 84.2301C946.866 84.1344 942.213 85.5338 938.31 88.2301C934.356 91.0944 931.289 95.014 929.46 99.5401C927.237 105.034 926.162 110.925 926.3 116.85C926.155 122.88 927.209 128.88 929.4 134.5C931.189 139.082 934.236 143.064 938.19 145.99C941.513 148.221 945.341 149.586 949.326 149.963C953.311 150.341 957.327 149.717 961.01 148.15C963.784 146.908 966.221 145.023 968.12 142.65C970.097 140.114 971.465 137.158 972.12 134.01H989.82C989.259 139.817 987.229 145.385 983.92 150.19C980.57 154.998 976.033 158.856 970.75 161.39C964.72 164.204 958.122 165.586 951.47 165.43Z"
      fill="#090A3A"
    />
    <path
      d="M1050.62 70.0999V84.7H999.57V70.0999H1050.62ZM1013.26 47.71H1031.47V136.11C1031.47 139.64 1032 142.28 1033.05 144.05C1033.96 145.686 1035.42 146.954 1037.16 147.64C1038.93 148.283 1040.79 148.601 1042.67 148.58C1043.95 148.594 1045.24 148.494 1046.5 148.28L1049.05 147.79L1052.34 162.79C1050.87 163.308 1049.37 163.723 1047.84 164.03C1045.44 164.505 1042.99 164.739 1040.54 164.73C1035.95 164.847 1031.38 163.977 1027.15 162.18C1023.09 160.438 1019.62 157.563 1017.15 153.9C1014.6 150.167 1013.33 145.483 1013.32 139.85L1013.26 47.71Z"
      fill="#090A3A"
    />
  </svg>
);
