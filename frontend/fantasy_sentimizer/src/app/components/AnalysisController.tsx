import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { getPlayerObjectForAnalysis, getNFLPlayers, performAnalysis } from "../api/sentiment_analysis_api";
import { analyzeSentiment } from "../utils/sentiment_analysis";
import { Spinner } from "@/components/ui/spinner";


interface SentimentScores {
    positive: number;
    negative: number;
    neutral: number;
}

interface DetailedSentiment {
    text: string;
    scores: SentimentScores;
    best_label: string;
}

interface PlayerSentiment {
    sentiment_consensus: SentimentScores;
    average_label: string;
    most_frequent_label: string;
    detailed_sentiment: DetailedSentiment[];
    status: string;
    transcript_name: string;
    player_id: string;
}

interface SentimentObject {
    [player: string]: PlayerSentiment
}

export default function AnalysisController({ submittedText }: { submittedText: string }) {
    const [loading, setLoading] = useState<boolean>(false);
    const [analysisResult, setAnalysisResult] = useState<SentimentObject>({});
    const [sortedPlayers, setSortedPlayers] = useState<string[]>([]);

    function getSortedKeys(obj: SentimentObject, order = 'desc') {
        return Object.keys(obj)
            .sort((a, b) => {
                const lengthA = obj[a]["detailed_sentiment"]?.length || 0;
                const lengthB = obj[b]["detailed_sentiment"]?.length || 0;
                return order === 'desc' ? lengthB - lengthA : lengthA - lengthB;
            });
    }

    function mockCallAPI() {
        const results = {
            "Aaron Adeoye": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.629146099090576,
                            "neutral": -3.3877978324890137,
                            "positive": -3.4777934551239014
                        },
                        "text": "Yeah, you did say that. Did I not say that? And here we are just a month later in Aaron engage. So tech I mean I was the one breaking news. I was the one that not breaking news."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "3910148",
                "sentiment_consensus": {
                    "negative": -3.629146099090576,
                    "neutral": -3.3877978324890137,
                    "positive": -3.4777934551239014
                },
                "status": "best of multiple matches",
                "transcript_name": "Aaron"
            },
            "Alvin Kamara": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.022519111633301,
                            "neutral": -3.715744972229004,
                            "positive": -2.383521318435669
                        },
                        "text": "I love his talent. It's just where the target shares where the opportunities, right? It's a that it all comes down to system and why we love again Alvin Kamaro so much because of the system he plays and how he plays. It's not as do the players. So, is there a path for Sam LePorta to join those elite guys again?"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3054850",
                "sentiment_consensus": {
                    "negative": -4.022519111633301,
                    "neutral": -3.715744972229004,
                    "positive": -2.383521318435669
                },
                "status": "perfect match",
                "transcript_name": "Alvin Kamaro"
            },
            "Ben Banogu": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.633939743041992,
                            "neutral": -2.3661341667175293,
                            "positive": -3.4449801445007324
                        },
                        "text": "Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year. really hasn't come together for Ben um yet and had a rough camper I heard rather yeah even even in camp hasn't been great so I think that's going to make them kind of rely on Z even more John Bates is a fine tight end he's just not going to be a factor in the pass catching realm and Z had a really good kick"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "3124970",
                "sentiment_consensus": {
                    "negative": -2.633939743041992,
                    "neutral": -2.3661341667175293,
                    "positive": -3.4449801445007324
                },
                "status": "best of multiple matches",
                "transcript_name": "Ben"
            },
            "Bijan Robinson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.0052103996276855,
                            "neutral": -1.5323458909988403,
                            "positive": -0.7643593549728394
                        },
                        "text": "I mean, it is it's Drake London to be Well, right. I'm sorry. besides Bijan Robinson, who is actually the number two. Um, but like down like a downfield, but young guys tend to not check it down as much. They tend to take more chances downfield."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4430807",
                "sentiment_consensus": {
                    "negative": -2.0052103996276855,
                    "neutral": -1.5323458909988403,
                    "positive": -0.7643593549728394
                },
                "status": "perfect match",
                "transcript_name": "Bijan Robinson"
            },
            "Blake Ferguson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.1418721675872803,
                            "neutral": -2.175111770629883,
                            "positive": -2.128349781036377
                        },
                        "text": "It got real wonky to back here because there's so many guys I wanted to get in, right? I I found a path for John Smith with paired back up with Arthur Smith to be the clear number two option in Pittsburgh. I think there's a chance for him to be Ferguson. I'm spread knowing how to hit him. Jake Ferguson has a chance like all those guys are all sitting there."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3843470",
                "sentiment_consensus": {
                    "negative": -3.1418721675872803,
                    "neutral": -2.175111770629883,
                    "positive": -2.128349781036377
                },
                "status": "best of multiple matches",
                "transcript_name": "Ferguson"
            },
            "Bralon Addison": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.9412211179733276,
                            "neutral": -3.0799973011016846,
                            "positive": -3.211458683013916
                        },
                        "text": "Only only played 10 games. He he probably is probably a little bit low for me right now that we're discussing things and talking about him on a podcast uh and not writing them down, which is which is very very easy to do. Um, listen, I I do think obviously especially with what's his name um being Addison. Addison being uh gone suspended for a couple games. Was it three games?"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.5863499641418457,
                            "neutral": -3.656517505645752,
                            "positive": -4.374256134033203
                        },
                        "text": "He he probably is probably a little bit low for me right now that we're discussing things and talking about him on a podcast uh and not writing them down, which is which is very very easy to do. Um, listen, I I do think obviously especially with what's his name um being Addison. Addison being uh gone suspended for a couple games. Was it three games? Four."
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "2971271",
                "sentiment_consensus": {
                    "negative": -1.7637855410575867,
                    "neutral": -3.3682574033737183,
                    "positive": -3.7928574085235596
                },
                "status": "best of multiple matches",
                "transcript_name": "Addison"
            },
            "Brock Bowers": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.6406577825546265,
                            "neutral": -3.999655246734619,
                            "positive": -2.254528284072876
                        },
                        "text": "I think I I think I So, he's not a top three round pick for you. No, I have to move him down specifically every single time. And I think I forgot I had to move I have to I have to go back in and move Brock Bowers down because when I don't it automatically moves him to my number one overall player. So, and I and it was just it was a it must have been like I I did an update, I forgot to just move him. Gotcha."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.0761058330535889,
                            "neutral": -2.3937740325927734,
                            "positive": -2.407223701477051
                        },
                        "text": "Yeah, it was less than cordial. Uh but I was looking at the ADP of where these guys were going and it shows it right here as well. Brock Bowers goes off the board at 17. Yeah, understandable. Sure."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.785482406616211,
                            "neutral": -2.1958940029144287,
                            "positive": -2.3650307655334473
                        },
                        "text": "100%. That's the value. Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go. Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is. instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.8794070482254028,
                            "neutral": -2.332491874694824,
                            "positive": -2.16849946975708
                        },
                        "text": "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go. Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is. instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle. Let me ask you this, though. You're sitting there at the last pick of the draft."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.6402647495269775,
                            "neutral": -2.2849040031433105,
                            "positive": -1.1588035821914673
                        },
                        "text": "I really wanted to put George Kittle as my tight end. I wanted to I didn't, but I I wanted to, but then I was like, dude, Jacobe Myers is always being already being whiny about his time over there. Like, dude, Brock Bowers is again all the targets. Number one, all the targets. So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.220152854919434,
                            "neutral": -2.1868319511413574,
                            "positive": -1.0489778518676758
                        },
                        "text": "Like, dude, Brock Bowers is again all the targets. Number one, all the targets. So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one. True. Just mind you that."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.50266695022583,
                            "neutral": -1.553314208984375,
                            "positive": -2.2674312591552734
                        },
                        "text": "True. Just mind you that. So Brock Bowers one, George Kittle two, Trey Trey McBride three. I just I went chalky chalk. I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.396917343139648,
                            "neutral": -3.375986099243164,
                            "positive": -4.784100532531738
                        },
                        "text": "It's a guy who's gonna be the number two target in their offense. It's only you be the first or second target in their offense. Obviously, uh you have Brock Bowers is number one target. Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense. George Kittle, if he's not number one, he's 1B, right?"
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "4432665",
                "sentiment_consensus": {
                    "negative": -2.767706871032715,
                    "neutral": -2.5403564274311066,
                    "positive": -2.306824430823326
                },
                "status": "perfect match",
                "transcript_name": "Brock Bowers"
            },
            "Caleb Benenoch": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.817081451416016,
                            "neutral": -2.8807196617126465,
                            "positive": -2.161867618560791
                        },
                        "text": "um when they got they got the ball in Kosen Levenson's hand on a quick easy pass right away and then another one you know a few plays later right down the seam and you know how do you make things easy on your quarterback is is give him predetermined quick easy reads that he can you know hit that back foot and and let it rip and Caleb we talked about it Caleb Williams actually looked good doing that we weren't sure if he was able to if he was going to be able to play within the confines of like a structured offense like that and he looked good doing it. And I think the way you kind of do that is make give him short, quick, easy passes and get him in a rhythm early. And I think they're going to try to establish that kind of offense pretty much throughout the entire year."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3047575",
                "sentiment_consensus": {
                    "negative": -5.817081451416016,
                    "neutral": -2.8807196617126465,
                    "positive": -2.161867618560791
                },
                "status": "best of multiple matches",
                "transcript_name": "Caleb"
            },
            "Caleb Johnson": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.8795926570892334,
                            "neutral": -2.6215929985046387,
                            "positive": -2.8884828090667725
                        },
                        "text": "So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.119281768798828,
                            "neutral": -2.9277732372283936,
                            "positive": -3.430501699447632
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4569383",
                "sentiment_consensus": {
                    "negative": -3.9994372129440308,
                    "neutral": -2.774683117866516,
                    "positive": -3.159492254257202
                },
                "status": "perfect match",
                "transcript_name": "Caleb Johnson"
            },
            "Caleb Williams": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.490664482116699,
                            "neutral": -2.797001838684082,
                            "positive": -2.27099347114563
                        },
                        "text": "um when they got they got the ball in Kosen Levenson's hand on a quick easy pass right away and then another one you know a few plays later right down the seam and you know how do you make things easy on your quarterback is is give him predetermined quick easy reads that he can you know hit that back foot and and let it rip and Caleb we talked about it Caleb Williams actually looked good doing that we weren't sure if he was able to if he was going to be able to play within the confines of like a structured offense like that and he looked good doing it. And I think the way you kind of do that is make give him short, quick, easy passes and get him in a rhythm early. And I think they're going to try to establish that kind of offense pretty much throughout the entire year."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4431611",
                "sentiment_consensus": {
                    "negative": -4.490664482116699,
                    "neutral": -2.797001838684082,
                    "positive": -2.27099347114563
                },
                "status": "perfect match",
                "transcript_name": "Caleb Williams"
            },
            "Colston Loveland": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.141888618469238,
                            "neutral": -2.8531384468078613,
                            "positive": -1.0972192287445068
                        },
                        "text": "And I think that's kind of gonna kind of snowball into Coulson Lovelin getting a lot of targets and then getting a lot of confidence. And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Coulson Lovelin is very good at. I think I think it's going to be kind of a glove inhand fit with with Coulson Lovelin, the young quarterback, and this offense. I kind of felt that way about Tyler Warren. We saw him, he's coming out of Penn State."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.005090713500977,
                            "neutral": -5.01057243347168,
                            "positive": -4.112458229064941
                        },
                        "text": "I kind of felt that way about Tyler Warren. We saw him, he's coming out of Penn State. We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career. Um coming off a year at Penn State where he had 104 catches uh for over,200 yards out there. All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.812403440475464,
                            "neutral": -3.149608612060547,
                            "positive": -2.6025171279907227
                        },
                        "text": "So, you but you still haven't finished as tight end eight amongst such a crowded room of weapons here. DJ Moore, uh, Romo Dunay, the the staff has been raving about Luther Burton over the last two weeks. So, how does how does Colston Lovelin carve out a path in a 2025 season as a rookie tight end? Yeah. Yeah."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.8957104682922363,
                            "neutral": -2.44195818901062,
                            "positive": -3.301187515258789
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.8789987564086914,
                            "neutral": -0.9921204447746277,
                            "positive": -2.126044988632202
                        },
                        "text": "Sounds good. Okay. So, Matt, you have Coloulston Lovelin in at number nine. Eight. Eight."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.190211296081543,
                            "neutral": -3.108391284942627,
                            "positive": -2.0669918060302734
                        },
                        "text": "oh he's tight end 12 again like it could easily be love at 12 but anyways who's your sixth through 12. All right 6 through 12 I went uh Travis Kelce Sam Sam LePorta at seven at eight I went Colston Loveland. Whoa. Yeah."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.059880256652832,
                            "neutral": -1.5563716888427734,
                            "positive": -0.6400169730186462
                        },
                        "text": "And I think they're going to try to establish that kind of offense pretty much throughout the entire year. And that that kind of stuff breeds, I think, or it lends itself to getting the tight ends specifically involved quickly and early. And I think that's kind of gonna kind of snowball into Coulson Lovelin getting a lot of targets and then getting a lot of confidence. And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Coulson Lovelin is very good at. I think I think it's going to be kind of a glove inhand fit with with Coulson Lovelin, the young quarterback, and this offense."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.245667934417725,
                            "neutral": -3.171156883239746,
                            "positive": -1.1166404485702515
                        },
                        "text": "And that that kind of stuff breeds, I think, or it lends itself to getting the tight ends specifically involved quickly and early. And I think that's kind of gonna kind of snowball into Coulson Lovelin getting a lot of targets and then getting a lot of confidence. And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Coulson Lovelin is very good at. I think I think it's going to be kind of a glove inhand fit with with Coulson Lovelin, the young quarterback, and this offense. I kind of felt that way about Tyler Warren."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4723086",
                "sentiment_consensus": {
                    "negative": -4.028731435537338,
                    "neutral": -2.7854147478938103,
                    "positive": -2.1328845396637917
                },
                "status": "perfect match",
                "transcript_name": "Colston Love"
            },
            "DJ Johnson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.951970338821411,
                            "neutral": -2.087329864501953,
                            "positive": -2.084657669067383
                        },
                        "text": "Yeah. I think, uh, you know, obviously this is a very crowded situation. Um, so that's going to be I think the biggest hurdle is to to get over is is to get the targets, but we've seen obviously rookies make a big impact in Ben Johnson's offense in the past. Sam Sam LePorta comes directly to mind his rookie year when he finished as I think tight end two or three. Um I can't remember it was he was tight end one at one point"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4240623",
                "sentiment_consensus": {
                    "negative": -2.951970338821411,
                    "neutral": -2.087329864501953,
                    "positive": -2.084657669067383
                },
                "status": "best of multiple matches",
                "transcript_name": "Ben Johnson's"
            },
            "DJ Moore": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.527363300323486,
                            "neutral": -3.9200446605682373,
                            "positive": -3.111210346221924
                        },
                        "text": "That makes sense. So, you but you still haven't finished as tight end eight amongst such a crowded room of weapons here. DJ Moore, uh, Romo Dunay, the the staff has been raving about Luther Burton over the last two weeks. So, how does how does Colston Lovelin carve out a path in a 2025 season as a rookie tight end? Yeah."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3915416",
                "sentiment_consensus": {
                    "negative": -4.527363300323486,
                    "neutral": -3.9200446605682373,
                    "positive": -3.111210346221924
                },
                "status": "perfect match",
                "transcript_name": "DJ Moore"
            },
            "Dalton Kincaid": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.401112079620361,
                            "neutral": -2.7727463245391846,
                            "positive": -1.5784351825714111
                        },
                        "text": "yes it's because they paid clear Shakir they didn't even pay him wide receiver one number they paid him wide receiver two to money and that's what Cleo Shakare really wins. So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid? I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around. I think for me even though he's tight end 26 last year um I think he has a chance to slide into that number one target role."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.0085530281066895,
                            "neutral": -2.526048183441162,
                            "positive": -1.2460927963256836
                        },
                        "text": "and that's what Cleo Shakare really wins. So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid? I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around. I think for me even though he's tight end 26 last year um I think he has a chance to slide into that number one target role. So yes, am I being biased here?"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -2.5314836502075195,
                            "neutral": -4.487401008605957,
                            "positive": -2.6904263496398926
                        },
                        "text": "Hunter Henry, I was like, dude, a very clear path for him to be the number two target there. Zach Ertz was another guy getting in there. I settle Dalton Kincaid. I think it's pretty clear and obvious this is a player, former first round pick, enters year three year. This is going to be his make or break year."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.0576446056365967,
                            "neutral": -1.7980033159255981,
                            "positive": -2.227235794067383
                        },
                        "text": "So, we just picked a different rookie tight end together. Mark Andrews at 11. And I have Dalton Kincaid at 12. Makes sense. Yeah."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4385690",
                "sentiment_consensus": {
                    "negative": -3.4996983408927917,
                    "neutral": -2.8960497081279755,
                    "positive": -1.9355475306510925
                },
                "status": "perfect match",
                "transcript_name": "Dalton Kincaid"
            },
            "Daniel Jones": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.019043922424316,
                            "neutral": -3.1435117721557617,
                            "positive": -1.49488365650177
                        },
                        "text": "This is offense. I think they're going to want to keep the ball everything short and sweet. Help Daniel Jones out on his roll out who's the athletic tight end. And I think they're going to find ways to make sure that he's either the first or second look in this offense. So, for me, I think Tyler Warren, just because of target share alone, how many catches he's going to get this year, is going to finish as a tight end one."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3917792",
                "sentiment_consensus": {
                    "negative": -4.019043922424316,
                    "neutral": -3.1435117721557617,
                    "positive": -1.49488365650177
                },
                "status": "perfect match",
                "transcript_name": "Daniel Jones"
            },
            "David Agoha": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7558398246765137,
                            "neutral": -1.7631596326828003,
                            "positive": -0.9761319756507874
                        },
                        "text": "T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier. And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys. This is the guy who I believe it is and it's my tight end four, David and David Njoku. Okay. That I mean"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.9969406127929688,
                            "neutral": -2.61112642288208,
                            "positive": -3.05772066116333
                        },
                        "text": "It's just not pos it's literally not possible for you to break that tier. So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.483930826187134,
                            "neutral": -2.082951068878174,
                            "positive": -2.56388258934021
                        },
                        "text": "So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.144225835800171,
                            "neutral": -2.0838279724121094,
                            "positive": -2.4394114017486572
                        },
                        "text": "Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.9120774269104004,
                            "neutral": -2.068632125854492,
                            "positive": -3.548757553100586
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.982145309448242,
                            "neutral": -3.68613862991333,
                            "positive": -1.4347740411758423
                        },
                        "text": "I have got him at tight end five I'm sure for very similar reasons. Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David and David Njoku was my guy for that. The easiest thing to do is just look at what he did with Joe Flacco before. That's it, man."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.2135305404663086,
                            "neutral": -2.5849485397338867,
                            "positive": -2.8483476638793945
                        },
                        "text": "We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun. I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram. I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.245079040527344,
                            "neutral": -2.239959716796875,
                            "positive": -2.7535343170166016
                        },
                        "text": "I think they're such different players that if they if he does start to see more snaps, it's because they're running two or two tight end likely. He's getting Isa like I think that's the case. I don't think it's at the expense of David and David Njoku. And they even talked about uh I think it was the tight end's coach that came out and said like, \"Yes, they're both tight ends, but they are extremely different players in the way that they play the game, and we want to utilize both of those skill sets. They're gonna listen, the Browns are going to run a lot of 12 personnel regardless.\""
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.1277995109558105,
                            "neutral": -1.8090523481369019,
                            "positive": -2.071448564529419
                        },
                        "text": "They're gonna listen, the Browns are going to run a lot of 12 personnel regardless.\" So, yeah. So, I have David and David Njoku at four. Um Garrett, you have him at four. Matt, you said I had him at five."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.944718360900879,
                            "neutral": -3.105588436126709,
                            "positive": -1.6359256505966187
                        },
                        "text": "So that's why I got him at number four. For what it's worth, I I kind of have a tier for me. David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven. So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could and that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "5144941",
                "sentiment_consensus": {
                    "negative": -3.480628728866577,
                    "neutral": -2.4035384893417358,
                    "positive": -2.3329934418201446
                },
                "status": "best of multiple matches",
                "transcript_name": "David"
            },
            "David Njoku": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5901637077331543,
                            "neutral": -2.0227973461151123,
                            "positive": -0.7728191018104553
                        },
                        "text": "T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier. And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys. This is the guy who I believe it is and it's my tight end four, David and David Njoku. Okay. That I mean"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7812118530273438,
                            "neutral": -2.6822571754455566,
                            "positive": -2.583963394165039
                        },
                        "text": "And we've made and that was my point about selling him too like hey man like he's now the number three target in that offense and you can't be an elite tight end if that's how you're going to operate. It's just not pos it's literally not possible for you to break that tier. So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.343975782394409,
                            "neutral": -2.57954478263855,
                            "positive": -2.5244574546813965
                        },
                        "text": "Uh um a Dillon Gabriel obviously kind of earned the backup role there after this last performance um in everyone's eyes here. He can operate this offense. I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Jok. So, I feel good about him being there and kind of being the number two guy. And number number one, uh, I can't remember what the other question was."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.455173492431641,
                            "neutral": -2.9090209007263184,
                            "positive": -2.63093900680542
                        },
                        "text": "It's just not pos it's literally not possible for you to break that tier. So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.468234539031982,
                            "neutral": -2.9440979957580566,
                            "positive": -2.370109796524048
                        },
                        "text": "So, for me, I'm with you. It's why I have him at five. I I couldn't get ahead of David Njoku because David Njoku's to me is a little bit more clear-cut. We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.382195472717285,
                            "neutral": -2.28359055519104,
                            "positive": -2.3040685653686523
                        },
                        "text": "So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.2495484352111816,
                            "neutral": -1.5513637065887451,
                            "positive": -1.9977113008499146
                        },
                        "text": "like you're getting him in the eighth round. So I think that's just crazy good value. It's why I'm willing to gamble on the George Kittle because if I miss out I'm totally comfortable getting in David Njoku. He mentioned and in total last year he averaged I think about 13 point 13 13.5 points per game in PPR leagues. He missed five games last year, still finishes tight end 10 uh overall."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.984480857849121,
                            "neutral": -3.8503224849700928,
                            "positive": -1.197012186050415
                        },
                        "text": "I have got him at tight end five I'm sure for very similar reasons. Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David and David Njoku was my guy for that. The easiest thing to do is just look at what he did with Joe Flacco before. That's it, man."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.0726423263549805,
                            "neutral": -2.54004168510437,
                            "positive": -2.7797045707702637
                        },
                        "text": "We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun. I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram. I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7342562675476074,
                            "neutral": -2.2051775455474854,
                            "positive": -1.9318479299545288
                        },
                        "text": "Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.028870105743408,
                            "neutral": -2.0252790451049805,
                            "positive": -2.4209065437316895
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.19856071472168,
                            "neutral": -2.2734363079071045,
                            "positive": -2.689121723175049
                        },
                        "text": "I think they're such different players that if they if he does start to see more snaps, it's because they're running two or two tight end likely. He's getting Isa like I think that's the case. I don't think it's at the expense of David and David Njoku. And they even talked about uh I think it was the tight end's coach that came out and said like, \"Yes, they're both tight ends, but they are extremely different players in the way that they play the game, and we want to utilize both of those skill sets. They're gonna listen, the Browns are going to run a lot of 12 personnel regardless.\""
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.333134651184082,
                            "neutral": -1.8822160959243774,
                            "positive": -2.0306200981140137
                        },
                        "text": "They're gonna listen, the Browns are going to run a lot of 12 personnel regardless.\" So, yeah. So, I have David and David Njoku at four. Um Garrett, you have him at four. Matt, you said I had him at five."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.69831383228302,
                            "neutral": -2.663837194442749,
                            "positive": -1.1343010663986206
                        },
                        "text": "So that's why I got him at number four. For what it's worth, I I kind of have a tier for me. David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven. So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could and that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.6139960289001465,
                            "neutral": -2.8104987144470215,
                            "positive": -0.7707876563072205
                        },
                        "text": "Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense. George Kittle, if he's not number one, he's 1B, right? I think the same thing in David Njoku falls into the same line as if he's not 1A, he is 1B. So that's what's going to propel him. I mean last year he saw the third most targets per game uh close to nine as it was."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3123076",
                "sentiment_consensus": {
                    "negative": -3.6623172044754027,
                    "neutral": -2.4815654357274375,
                    "positive": -2.0092246929804483
                },
                "status": "perfect match",
                "transcript_name": "David Njoku"
            },
            "DeVonta Smith": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.576779365539551,
                            "neutral": -2.620028257369995,
                            "positive": -1.2019832134246826
                        },
                        "text": "It just comes down to the situation. Exactly. I feel like Dvonte Smith, like I said last year, like I love Devonte Smith. I love his talent. It's just where the target shares where the opportunities, right?"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4241478",
                "sentiment_consensus": {
                    "negative": -4.576779365539551,
                    "neutral": -2.620028257369995,
                    "positive": -1.2019832134246826
                },
                "status": "perfect match",
                "transcript_name": "Dvonte Smith"
            },
            "DeWayne McBride": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.472952365875244,
                            "neutral": -1.0478355884552002,
                            "positive": -1.4574885368347168
                        },
                        "text": "But I mean, you know, it's it is what it is. These guys, you can't go wrong with either one of these. I ended up going Brock Bowers George Kittle Trey McBride is on the same page. Yeah, we're on the same page. Here's here's my one beef with this right now."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4430388",
                "sentiment_consensus": {
                    "negative": -3.472952365875244,
                    "neutral": -1.0478355884552002,
                    "positive": -1.4574885368347168
                },
                "status": "best of multiple matches",
                "transcript_name": "KD McBride"
            },
            "Deebo Samuel": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.11039400100708,
                            "neutral": -2.635892391204834,
                            "positive": -1.744547724723816
                        },
                        "text": "So, I I almost got him in. Um, so did I. I wanted to. If it wasn't for Debo Samuel, Zach Ertz would have been higher. That That's been on my mind. But I I"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3126486",
                "sentiment_consensus": {
                    "negative": -3.11039400100708,
                    "neutral": -2.635892391204834,
                    "positive": -1.744547724723816
                },
                "status": "perfect match",
                "transcript_name": "Debo Samuel"
            },
            "Deshaun Watson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.4440367221832275,
                            "neutral": -1.9984132051467896,
                            "positive": -1.6920264959335327
                        },
                        "text": "You know, obviously we only saw one preseason kind of series with those two guys on the field and it was a a misfire on the target. Um as far as uh Jerry Jeudy and and Joe Flacco, but I I think I think David Njoku and him have proven over time that you know obviously they have a really really strong connection. And even any quarterback not named Deshun Watson to start and finish a game last year, he averaged over 15 points a game. Yeah. So, he's still putting up borderline number one overall tight end numbers just with any random quarterback last year."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3122840",
                "sentiment_consensus": {
                    "negative": -2.4440367221832275,
                    "neutral": -1.9984132051467896,
                    "positive": -1.6920264959335327
                },
                "status": "perfect match",
                "transcript_name": "Deshun Watson"
            },
            "Dillon Gabriel": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.3460893630981445,
                            "neutral": -2.981750011444092,
                            "positive": -2.95279598236084
                        },
                        "text": "But I think the Vikings game is where like that's where we're going to start to pivot. And then you're right. I think they're going to want to see what they have in Dillon Gabriel because like if they they spend a third round pick on him. I I've been kind of hammering this all along, right? Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.839697360992432,
                            "neutral": -1.8313874006271362,
                            "positive": -2.2609446048736572
                        },
                        "text": "I think they're going to want to see what they have in Dillon Gabriel because like if they they spend a third round pick on him. I I've been kind of hammering this all along, right? Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback. I mean I said it when they drafted him that dude can run the offense right now and he looks like he can run the offense right now. He looks good."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.968393325805664,
                            "neutral": -3.605778694152832,
                            "positive": -1.7643611431121826
                        },
                        "text": "Just let's move on. I threw myself off with the A in one. I think if you bring in a guy like Dillon Gabriel, they're going to try and keep things short and sweet for him to start, right? Like a lot of quick things like in the flat over the I remembered one. Harold Fannon looked good in this past few seasons and and with David Njoku coming into a contract year, is there any thought that he chips away and and starts kind of getting a bigger piece of that pie?"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -5.123305797576904,
                            "neutral": -1.9075318574905396,
                            "positive": -2.2064619064331055
                        },
                        "text": "First a question a and then I'm gonna go to one. Uh um a Dillon Gabriel obviously kind of earned the backup role there after this last performance um in everyone's eyes here. He can operate this offense. I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Jok."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4427238",
                "sentiment_consensus": {
                    "negative": -4.319371461868286,
                    "neutral": -2.58161199092865,
                    "positive": -2.2961409091949463
                },
                "status": "perfect match",
                "transcript_name": "Dillon Gabriel"
            },
            "Dorian Thompson-Robinson": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.180815577507019,
                            "neutral": -3.2872157096862793,
                            "positive": -2.072420120239258
                        },
                        "text": "So, he's still putting up borderline number one overall tight end numbers just with any random quarterback last year. Jameus Winston, uh, Thomas, uh, I even forget his name now. Thompson Robinson, Dorian Thompson Robinson, the worst quarterback I've ever seen play in. Yeah, terrible. Uh, like it didn't didn't matter who it was."
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "4367178",
                "sentiment_consensus": {
                    "negative": -1.180815577507019,
                    "neutral": -3.2872157096862793,
                    "positive": -2.072420120239258
                },
                "status": "perfect match",
                "transcript_name": "Thompson Robinson"
            },
            "Drake London": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.339279651641846,
                            "neutral": -2.306953191757202,
                            "positive": -2.2799057960510254
                        },
                        "text": "Like, this is this is a must. He's the number two option in this offense. I mean, it is it's Drake London to be Well, right. I'm sorry. besides Bijan Robinson, who is actually the number two."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4426502",
                "sentiment_consensus": {
                    "negative": -4.339279651641846,
                    "neutral": -2.306953191757202,
                    "positive": -2.2799057960510254
                },
                "status": "perfect match",
                "transcript_name": "Drake London"
            },
            "Evan Engram": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.5149197578430176,
                            "neutral": -3.124201774597168,
                            "positive": -2.454225540161133
                        },
                        "text": "I think even though I'm the one like like proponent of him and I'm down on him, but I would still rather just like the the tight that position's so elusive. and he's still so young. I would rather just gamble on the upside and like and then hope that like he doesn't work out in like Atlanta and he goes somewhere else and like just like Evan Engram it was great, right? And he has so much time like dude he could be a dud for two more years and be as year 27 still have three or four guys. We've been wanting a guy to go here forever."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.4934585094451904,
                            "neutral": -2.913604497909546,
                            "positive": -3.009012460708618
                        },
                        "text": "Do you want six through 12? Just remind a little recap on that. We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.5500221252441406,
                            "neutral": -2.033714771270752,
                            "positive": -2.624664068222046
                        },
                        "text": "Uh and then for me, I have at seven, I have Sam LePorta. Yep. And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam LePorta he's the 51st guy off the board then when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is 82 Tucker Tucker Kraft's 108 um so"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.366140365600586,
                            "neutral": -3.4010984897613525,
                            "positive": -4.668675899505615
                        },
                        "text": "And obviously, it's on the back of, you know, all the talk this whole offseason about Tron Peyton wanting to get a Evan Engram and then him going out and kind of finding his guy, going out and saying, \"Hey, this is this is the guy that I want.\" Him and R.J. Harvey, which I think R.J. Harvey is going to have a role this year. I don't know that it's going to be as the Evan Engram yet. You know, I think that's kind of one of those things that he'll have to grow into if he if he does become the long term. And RJ Harvey's not even going to play on third downs."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.0036673545837402,
                            "neutral": -1.5732413530349731,
                            "positive": -1.254942774772644
                        },
                        "text": "like So I had So who's your six then? Because we have our Oh, yeah. So you have I think my Evan Engram was or no? Oh yeah, Evan Engram four Jou five and then Travis G. So who did you have?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.356133222579956,
                            "neutral": -3.287435531616211,
                            "positive": -3.1538734436035156
                        },
                        "text": "It's why I have him at five. I I couldn't get ahead of David Njoku because David Njoku's to me is a little bit more clear-cut. We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun. I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.914172649383545,
                            "neutral": -1.583001732826233,
                            "positive": -1.9773603677749634
                        },
                        "text": "Because we have our Oh, yeah. So you have I think my Evan Engram was or no? Oh yeah, Evan Engram four Jou five and then Travis G. So who did you have? I have T.J. Hockenson at six."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.99485445022583,
                            "neutral": -2.5955424308776855,
                            "positive": -2.8226065635681152
                        },
                        "text": "We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun. I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram. I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": 0.2772282063961029,
                            "neutral": -3.76542329788208,
                            "positive": -2.3021326065063477
                        },
                        "text": "Now to be fair we saw a guy in the same exact mold, right? guy we already talked about, Ev. Evan Engram came out, same gang busters. Same exact thing. Same exact thing and then fell off the face of the for the New York Giants."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.9773157835006714,
                            "neutral": -3.394589900970459,
                            "positive": -1.1860989332199097
                        },
                        "text": "David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven. So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could and that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there and I'm agree with you. I think he does play that Evan Engram role."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.6930084228515625,
                            "neutral": -1.756859302520752,
                            "positive": -2.243386745452881
                        },
                        "text": "Can can catch some passes. I don't think he falls into the Evan Engram kind of role as much as he is kind of just like an every down type of guy at this point in his career after all the injuries. So Evan Engram is left, you know, as the guy that they're going to kind of use as this moving chest piece. And I think Shawn Peyton has proven in the past that he he really likes to target the tight end and really likes to get those guys involved. So that's why I got him at number four."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.478461742401123,
                            "neutral": -3.6273086071014404,
                            "positive": -0.426741361618042
                        },
                        "text": "Yeah, he's super talented, man. And and you know, given, you know, that some of these guys, you know, George Kittle's a little bit older. Evan Engram's a little bit older. Travis Kelce obviously a little bit older. He's a guy that we're going to be having to have the conversation, you know, is he this next guy that's going to be able to get a tier if if Green Bay's wide receivers kind of start to dissipate in the next couple of seasons or even just solidify who's who and well, what's what's the roles there?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.092147350311279,
                            "neutral": -3.284470558166504,
                            "positive": -2.4209485054016113
                        },
                        "text": "So even though I have T.J. Hockenson at six, I'm with you in the tier group. Five through like eight to me are pretty close. I like I almost want to put Evan Engram in his own tier because I'm with you Matt like how I believe he's going to play that Evan Engram role. Once I know that for sure, he's locked in there. And that's why I said like six through eight I feel more comfortable interchanging."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.1092193126678467,
                            "neutral": -3.4369473457336426,
                            "positive": -1.5734061002731323
                        },
                        "text": "For what it's worth, I I kind of have a tier for me. David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven. So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could and that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there and I'm agree with you."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.264642715454102,
                            "neutral": -1.973245620727539,
                            "positive": -1.4767389297485352
                        },
                        "text": "So, who do you have at four? I got the Evan Engram, man. Evan Engram. That's what I have at five. Yeah."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3051876",
                "sentiment_consensus": {
                    "negative": -2.9687290370464323,
                    "neutral": -2.783379014333089,
                    "positive": -2.239654286702474
                },
                "status": "perfect match",
                "transcript_name": "Evan Engram"
            },
            "Garrett Wilson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9412615299224854,
                            "neutral": -1.6221678256988525,
                            "positive": -0.43999916315078735
                        },
                        "text": "I mean, I can see that, too. Yeah, no doubt. Nobody there to catch the football outside of Garrett Wilson. Wilson and him. Baron."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4569618",
                "sentiment_consensus": {
                    "negative": -3.9412615299224854,
                    "neutral": -1.6221678256988525,
                    "positive": -0.43999916315078735
                },
                "status": "perfect match",
                "transcript_name": "Garrett Wilson"
            },
            "George Kittle": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.6760382652282715,
                            "neutral": -2.0477237701416016,
                            "positive": -2.5810775756835938
                        },
                        "text": "We've been talking about him a lot, so it doesn't surprise me. Yeah. So, like if I miss out on George Kittle to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam LePorta is going to usually go tight end four there. T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier. And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.7312031984329224,
                            "neutral": -2.8620595932006836,
                            "positive": -4.302116394042969
                        },
                        "text": "I love him. I was like, uh, number nine, Tucker Tucker Kraft. Now, now we see why George Kittle is below him in our in our GM tool. That might just be a function of We'll talk about that later. Um, Mark 10 10 Mark Andrews, 11 Zach Ertz."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.539957523345947,
                            "neutral": -3.613607406616211,
                            "positive": -2.5269346237182617
                        },
                        "text": "Which is again either way, but you could mix them up, but I I do have a preference. I really wanted to put George Kittle as my tight end. I wanted to I didn't, but I I wanted to, but then I was like, dude, Jacobe Myers is always being already being whiny about his time over there. Like, dude, Brock Bowers is again all the targets."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.3616552352905273,
                            "neutral": -2.446183204650879,
                            "positive": -1.8585244417190552
                        },
                        "text": "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go. Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is. instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle. Let me ask you this, though. You're sitting there at the last pick of the draft."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.794804573059082,
                            "neutral": -2.61110782623291,
                            "positive": -1.8743380308151245
                        },
                        "text": "That's the value. Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go. Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is. instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle. Let me ask you this, though."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.943540573120117,
                            "neutral": -2.5902838706970215,
                            "positive": -2.230069160461426
                        },
                        "text": "Like, dude, Brock Bowers is again all the targets. Number one, all the targets. So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one. True. Just mind you that."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.607614755630493,
                            "neutral": -1.4976201057434082,
                            "positive": -2.4520463943481445
                        },
                        "text": "True. Just mind you that. So Brock Bowers one, George Kittle two, Trey Trey McBride three. I just I went chalky chalk. I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.043546199798584,
                            "neutral": -2.967548370361328,
                            "positive": -1.44692862033844
                        },
                        "text": "So that's why I got him at number four. For what it's worth, I I kind of have a tier for me. David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven. So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could and that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.017979145050049,
                            "neutral": -3.8888776302337646,
                            "positive": -1.425400733947754
                        },
                        "text": "Obviously, uh you have Brock Bowers is number one target. Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense. George Kittle, if he's not number one, he's 1B, right? I think the same thing in David Njoku falls into the same line as if he's not 1A, he is 1B. So that's what's going to propel him."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.3294320106506348,
                            "neutral": -2.153588056564331,
                            "positive": 1.00429368019104
                        },
                        "text": "It went from seven to five. So he lost two targets per game because Jameson Williams took a big step up. What did we used to talk about with George Kittle? It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta. If he if one of those guys goes down and Sam LePorta all of a sudden gets more of the target share because those naturally they're just out of the offense, then yeah, he can bump way the heck up."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3040151",
                "sentiment_consensus": {
                    "negative": -3.204577147960663,
                    "neutral": -2.667859983444214,
                    "positive": -1.9693142294883728
                },
                "status": "perfect match",
                "transcript_name": "George Kittle"
            },
            "Harold Fannin Jr.": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.8653476238250732,
                            "neutral": -2.877854347229004,
                            "positive": -1.3388198614120483
                        },
                        "text": "I think if you bring in a guy like Dillon Gabriel, they're going to try and keep things short and sweet for him to start, right? Like a lot of quick things like in the flat over the I remembered one. Harold Fannon looked good in this past few seasons and and with David Njoku coming into a contract year, is there any thought that he chips away and and starts kind of getting a bigger piece of that pie? I think they're such different players that if they if he does start to see more snaps, it's because they're running two or two tight end likely. He's getting Isa like I think that's the case."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "5083076",
                "sentiment_consensus": {
                    "negative": -3.8653476238250732,
                    "neutral": -2.877854347229004,
                    "positive": -1.3388198614120483
                },
                "status": "perfect match",
                "transcript_name": "Harold Fannon"
            },
            "Henry Anderson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.355787754058838,
                            "neutral": -2.1781954765319824,
                            "positive": -1.7521380186080933
                        },
                        "text": "And he's just the most unsexy guy to do it. But if if something goes wonky in my my reddraft leagues or even in my dynasty leagues and I just don't have a tight end, he's the easy like break glass in case of emergency guy because I know he's going to get me eight to nine points a game and twothirds probably get it done. You know, if not a third, a third and fourth would get done for Henry. And and you're right, like I He's another guy I really want to get in."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "2517752",
                "sentiment_consensus": {
                    "negative": -2.355787754058838,
                    "neutral": -2.1781954765319824,
                    "positive": -1.7521380186080933
                },
                "status": "best of multiple matches",
                "transcript_name": "Henry"
            },
            "Hunter Henry": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.333320379257202,
                            "neutral": -3.0927770137786865,
                            "positive": -0.834807813167572
                        },
                        "text": "I still think he's going to be inside the top eight or so at on targets. And I think they're going to be better targets this year. and and Hunter Henry even missed the game. So, it wasn't even like he he played every game. Uh but he was still there."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.3787894248962402,
                            "neutral": -1.8650250434875488,
                            "positive": -2.613297700881958
                        },
                        "text": "So, it wasn't even like he he played every game. Uh but he was still there. 97 targets last year for Hunter Henry. Very very solid number. And he's just the most unsexy guy to do it."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.8312177658081055,
                            "neutral": -4.130796432495117,
                            "positive": -3.7521796226501465
                        },
                        "text": "We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry. And at 12 I have Kyle Pitts. I thought about getting Hunter Henry in there."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -5.033924102783203,
                            "neutral": -4.165515422821045,
                            "positive": -4.2587456703186035
                        },
                        "text": "At 11 I have Hunter Henry. And at 12 I have Kyle Pitts. I thought about getting Hunter Henry in there. I you know it's a weird it's a weird range down there and I was like it is very weird"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.828094005584717,
                            "neutral": -4.5632452964782715,
                            "positive": -2.4343738555908203
                        },
                        "text": "I'm spread knowing how to hit him. Jake Ferguson has a chance like all those guys are all sitting there. Hunter Henry, I was like, dude, a very clear path for him to be the number two target there. Zach Ertz was another guy getting in there. I settle Dalton Kincaid."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.6987338066101074,
                            "neutral": -2.1780447959899902,
                            "positive": -1.4824990034103394
                        },
                        "text": "Yeah. compared to ADP. And it's the thing what Kyle Pitts cost you compared to what you give Hunter Henry for. It's like or Zach Ertz, you know what I mean? It's like Exactly."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.239469528198242,
                            "neutral": -3.64741849899292,
                            "positive": -0.9041629433631897
                        },
                        "text": "So he's going to be 35. So Garrett, who was your outlier? My weird one was uh Hunter Henry. Hunter Henry. Uh here here's the biggest reason."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.014439105987549,
                            "neutral": -4.184781074523926,
                            "positive": -0.08679328113794327
                        },
                        "text": "So Garrett, who was your outlier? My weird one was uh Hunter Henry. Hunter Henry. Uh here here's the biggest reason. total targets at the tight end position."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.8437376022338867,
                            "neutral": -2.0546460151672363,
                            "positive": -1.9540592432022095
                        },
                        "text": "Uh, some former Rams guy. Okay. There's so many all the like when we talk about all those bunch of guys in the bottom there like a guy in Zachary, it's Hunter Henry. I feel more comfortable about all them than Kyle Pitts. Like I just I'm I'm done until I see it"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3046439",
                "sentiment_consensus": {
                    "negative": -3.133525080151028,
                    "neutral": -3.3202499548594155,
                    "positive": -2.0356576815247536
                },
                "status": "perfect match",
                "transcript_name": "Hunter Henry"
            },
            "Isaac TeSlaa": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.8362324237823486,
                            "neutral": -2.9027442932128906,
                            "positive": -2.2377424240112305
                        },
                        "text": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "5123663",
                "sentiment_consensus": {
                    "negative": -3.8362324237823486,
                    "neutral": -2.9027442932128906,
                    "positive": -2.2377424240112305
                },
                "status": "perfect match",
                "transcript_name": "Isaac Tessa"
            },
            "J.J. McCarthy": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.337122440338135,
                            "neutral": -3.584512233734131,
                            "positive": -1.4845050573349
                        },
                        "text": "And I think he's extremely talented tight end who at one point had my dynasty tight end won overall because how much I loved him. I think that Jordan missing a couple games is enough to really propel him. Now that he's more than a full year removed from his injury, the fact that he's gonna be able to slide in as a number two target in this offense, um I think it'll kind of help propel him, build that rapport, JJ McCarthy, be again, we always talk about these rookie quarterbacks, like always one of their safety nets. It's usually the tight end. I think T.J. Hockenson kind of felt um find himself in that position."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4433970",
                "sentiment_consensus": {
                    "negative": -4.337122440338135,
                    "neutral": -3.584512233734131,
                    "positive": -1.4845050573349
                },
                "status": "best of multiple matches",
                "transcript_name": "JJ McCarthy"
            },
            "J.K. Dobbins": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.855372428894043,
                            "neutral": -1.0568803548812866,
                            "positive": -1.61968195438385
                        },
                        "text": "As it's reported right now. All right. So, I mean, we all know that, you know, JK Dobbins is a talented guy. Can can catch some passes. I don't think he falls into the Evan Engram kind of role as much as he is kind of just like an every down type of guy at this point in his career after all the injuries."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.6095290184020996,
                            "neutral": -2.0336899757385254,
                            "positive": -1.6318068504333496
                        },
                        "text": "Like, you know, it's Yeah, it sounds like his pass blocking is a big concern at this point. So, he'll really need to grow in order to become that kind of guy. JK Dobbins is reported he's the starter. Okay. As it's reported right now."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4241985",
                "sentiment_consensus": {
                    "negative": -3.2324507236480713,
                    "neutral": -1.545285165309906,
                    "positive": -1.6257444024085999
                },
                "status": "perfect match",
                "transcript_name": "JK Dobbins"
            },
            "Jake Ferguson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.4469645023345947,
                            "neutral": -3.47796368598938,
                            "positive": -2.1917803287506104
                        },
                        "text": "I think there's a chance for him to be Ferguson. I'm spread knowing how to hit him. Jake Ferguson has a chance like all those guys are all sitting there. Hunter Henry, I was like, dude, a very clear path for him to be the number two target there. Zach Ertz was another guy getting in there."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4242355",
                "sentiment_consensus": {
                    "negative": -3.4469645023345947,
                    "neutral": -3.47796368598938,
                    "positive": -2.1917803287506104
                },
                "status": "perfect match",
                "transcript_name": "Jake Ferguson"
            },
            "Jameis Winston": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.1312074661254883,
                            "neutral": -1.8821581602096558,
                            "positive": -1.104176640510559
                        },
                        "text": "Yeah. So, he's still putting up borderline number one overall tight end numbers just with any random quarterback last year. Jameus Winston, uh, Thomas, uh, I even forget his name now. Thompson Robinson, Dorian Thompson Robinson, the worst quarterback I've ever seen play in. Yeah, terrible."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "2969939",
                "sentiment_consensus": {
                    "negative": -2.1312074661254883,
                    "neutral": -1.8821581602096558,
                    "positive": -1.104176640510559
                },
                "status": "perfect match",
                "transcript_name": "Jameus Winston"
            },
            "Jameson Williams": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.8350193500518799,
                            "neutral": -3.0946385860443115,
                            "positive": -2.8857192993164062
                        },
                        "text": "I think he's a very, very talented player. But once again, if this offense just takes a 5% step back, 10% step back. And then if Jameson Williams is actually more involved and takes some of that away, like there's just a lot of little things. They don't have to be huge things, just little things that could pull him back that could all go the wrong way, basically. And Sam LePorta was eight last year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.540698289871216,
                            "neutral": -3.255399703979492,
                            "positive": -3.252711296081543
                        },
                        "text": "It's just there's only one football and there's only so many targets to go around per year. Yeah. And we saw Jameson Williams clearly establish himself as a number two target at offense. And we've made and that was my point about selling him too like hey man like he's now the number three target in that offense and you can't be an elite tight end if that's how you're going to operate. It's just not pos it's literally not possible for you to break that tier."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.776205539703369,
                            "neutral": -3.8480451107025146,
                            "positive": -2.110802412033081
                        },
                        "text": "Um, and the reason why is I still have some my notes back here from early like six months ago and it says what happened to his targets per game. It went from seven to five. So he lost two targets per game because Jameson Williams took a big step up. What did we used to talk about with George Kittle? It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9619052410125732,
                            "neutral": -3.2788443565368652,
                            "positive": -2.6736884117126465
                        },
                        "text": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4426388",
                "sentiment_consensus": {
                    "negative": -3.2784571051597595,
                    "neutral": -3.369231939315796,
                    "positive": -2.730730354785919
                },
                "status": "perfect match",
                "transcript_name": "Jameson Williams"
            },
            "Jaxson Dart": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.47654390335083,
                            "neutral": -2.5481984615325928,
                            "positive": -3.4537768363952637
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4689114",
                "sentiment_consensus": {
                    "negative": -3.47654390335083,
                    "neutral": -2.5481984615325928,
                    "positive": -3.4537768363952637
                },
                "status": "best of multiple matches",
                "transcript_name": "Jackson Dart"
            },
            "Jayden Daniels": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9870190620422363,
                            "neutral": -2.626145362854004,
                            "positive": -2.2464306354522705
                        },
                        "text": "I just I I I think this is a great offense. Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year. really hasn't come together for Ben um yet and had a rough camper I heard rather yeah"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4426348",
                "sentiment_consensus": {
                    "negative": -3.9870190620422363,
                    "neutral": -2.626145362854004,
                    "positive": -2.2464306354522705
                },
                "status": "best of multiple matches",
                "transcript_name": "Jaden Daniels"
            },
            "Jerry Jeudy": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": 2.8801755905151367,
                            "neutral": -2.6085338592529297,
                            "positive": -2.289137363433838
                        },
                        "text": "Yeah. But the the guy to own for me in this offense, if I have to pick one, is absolutely David 100%. That's I'm a little bit lower on Jerry Jeudy than probably like I think than Rich because I think it's going to be the David Njoku show. Y it's going to be they're going to be running the heck out of the ball."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7953310012817383,
                            "neutral": -2.974491596221924,
                            "positive": -1.7276796102523804
                        },
                        "text": "I haven't seen the type of connection. You know, obviously we only saw one preseason kind of series with those two guys on the field and it was a a misfire on the target. Um as far as uh Jerry Jeudy and and Joe Flacco, but I I think I think David Njoku and him have proven over time that you know obviously they have a really really strong connection. And even any quarterback not named Deshun Watson to start and finish a game last year, he averaged over 15 points a game. Yeah."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.065821647644043,
                            "neutral": -2.7109642028808594,
                            "positive": -1.510143756866455
                        },
                        "text": "Did you see all the videos of them in golf carts together having a good time? Like, dude, he's going to be force-fed targets. Like, it I like Jerry Jeudy as well. Yeah. But the the guy to own for me in this offense, if I have to pick one, is absolutely David 100%."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4241463",
                "sentiment_consensus": {
                    "negative": -1.326992352803548,
                    "neutral": -2.7646632194519043,
                    "positive": -1.8423202435175579
                },
                "status": "perfect match",
                "transcript_name": "Jerry Jeudy"
            },
            "Joe Flacco": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -1.4109739065170288,
                            "neutral": -0.9712293744087219,
                            "positive": -1.1413813829421997
                        },
                        "text": "He produced. He produced. So, you have that and you get Joe Flaccco back. Like I I think he's a smash value because his ADP right now in reddraft is tight end ninth off the board and he's going in the 80s overall. So in your traditional 10-man league that's eighth round"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.400223970413208,
                            "neutral": -1.7065035104751587,
                            "positive": -2.2210474014282227
                        },
                        "text": "Uh um a Dillon Gabriel obviously kind of earned the backup role there after this last performance um in everyone's eyes here. He can operate this offense. I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Jok. So, I feel good about him being there and kind of being the number two guy. And number number one, uh, I can't remember what the other question was."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.1343743801116943,
                            "neutral": -3.7416539192199707,
                            "positive": -2.064878463745117
                        },
                        "text": "I'm sure for very similar reasons. Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David and David Njoku was my guy for that. The easiest thing to do is just look at what he did with Joe Flacco before. That's it, man. That's the easiest thing to do."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.8257369995117188,
                            "neutral": -2.2880773544311523,
                            "positive": -2.1355056762695312
                        },
                        "text": "I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram. I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront. Yeah. If this thing starts going off the rails we have to do our best to see what we have in this third round pick this fifth round pick."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9575870037078857,
                            "neutral": -3.2973597049713135,
                            "positive": -0.14438557624816895
                        },
                        "text": "So that's what's going to propel him. I mean last year he saw the third most targets per game uh close to nine as it was. So I think with the quarterback play he's a get from Joe Flacco. We mentioned reported he's already got those guys are like two piece in the pod like you mentioned. This is a player who's gotten better every single year of his career."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "11252",
                "sentiment_consensus": {
                    "negative": -2.945779252052307,
                    "neutral": -2.4009647727012635,
                    "positive": -1.541439700126648
                },
                "status": "perfect match",
                "transcript_name": "Joe Flacco"
            },
            "John Bates": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -1.2999728918075562,
                            "neutral": -0.7828863263130188,
                            "positive": -4.171807289123535
                        },
                        "text": "really hasn't come together for Ben um yet and had a rough camper I heard rather yeah even even in camp hasn't been great so I think that's going to make them kind of rely on Z even more John Bates is a fine tight end he's just not going to be a factor in the pass catching realm and Z had a really good kick right and Z has looked great"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4048228",
                "sentiment_consensus": {
                    "negative": -1.2999728918075562,
                    "neutral": -0.7828863263130188,
                    "positive": -4.171807289123535
                },
                "status": "perfect match",
                "transcript_name": "John Bates"
            },
            "Jordan Addison": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.996495485305786,
                            "neutral": -3.349252223968506,
                            "positive": -1.0609642267227173
                        },
                        "text": "And this is somebody when you look back at 2022 tight end two overall, 2023 tight end four overall. And I think he's extremely talented tight end who at one point had my dynasty tight end won overall because how much I loved him. I think that Jordan missing a couple games is enough to really propel him. Now that he's more than a full year removed from his injury, the fact that he's gonna be able to slide in as a number two target in this offense, um I think it'll kind of help propel him, build that rapport, JJ McCarthy, be again, we always talk about these rookie quarterbacks, like always one of their safety nets. It's usually the tight end."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4429205",
                "sentiment_consensus": {
                    "negative": -3.996495485305786,
                    "neutral": -3.349252223968506,
                    "positive": -1.0609642267227173
                },
                "status": "best of multiple matches",
                "transcript_name": "Jordan"
            },
            "Josh Downs": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.366141319274902,
                            "neutral": -3.312981367111206,
                            "positive": -2.337975025177002
                        },
                        "text": "Um coming off a year at Penn State where he had 104 catches uh for over,200 yards out there. All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often. So with those reports saying like we said, I like Josh Downs a ton. I like uh Michael Pitman as well. This is offense."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4688813",
                "sentiment_consensus": {
                    "negative": -4.366141319274902,
                    "neutral": -3.312981367111206,
                    "positive": -2.337975025177002
                },
                "status": "perfect match",
                "transcript_name": "Josh Downs"
            },
            "Josh Smith": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.302690267562866,
                            "neutral": -2.8547558784484863,
                            "positive": -3.23695969581604
                        },
                        "text": "And you're right, man. It got real wonky to back here because there's so many guys I wanted to get in, right? I I found a path for John Smith with paired back up with Arthur Smith to be the clear number two option in Pittsburgh. I think there's a chance for him to be Ferguson. I'm spread knowing how to hit him."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "3915778",
                "sentiment_consensus": {
                    "negative": -3.302690267562866,
                    "neutral": -2.8547558784484863,
                    "positive": -3.23695969581604
                },
                "status": "best of multiple matches",
                "transcript_name": "John Smith"
            },
            "Justin Herbert": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.4268399477005005,
                            "neutral": -2.456003189086914,
                            "positive": -3.5509915351867676
                        },
                        "text": "And he has so much time like dude he could be a dud for two more years and be as year 27 still have three or four guys. We've been wanting a guy to go here forever. What if he's finally the guy that joins Justin Herbert? Oh dude. Yeah."
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "4038941",
                "sentiment_consensus": {
                    "negative": -1.4268399477005005,
                    "neutral": -2.456003189086914,
                    "positive": -3.5509915351867676
                },
                "status": "perfect match",
                "transcript_name": "Justin Herbert"
            },
            "Kenny Pickett": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.6712913513183594,
                            "neutral": -2.7794055938720703,
                            "positive": -2.2211718559265137
                        },
                        "text": "And I I like David Njoku. Obviously, we're all gushing about him right now. Do you guys have any concern that hey, they got rid of Kenny Kenny Picket? If something happens, they lose a few games, they're going to start turning to these rookies and then who the hell knows what we got out of a guy like David Njoku. No, I think Garrett, like even mentioned, like the way he's the fact he was able to produce even all the other turds back then."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -3.4391767978668213,
                            "neutral": -4.124307155609131,
                            "positive": -4.656060695648193
                        },
                        "text": "So next year we have the most informed decision possible. Do we need to go out and make a move at quarterback? And I think that is I think especially with with the trading away of Kenny Picket that signals that that path even more to me. I I've said that for a while now. I think um I think this schedule starts so tough you can't throw a rookie quarterback in there."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4240703",
                "sentiment_consensus": {
                    "negative": -3.5552340745925903,
                    "neutral": -3.4518563747406006,
                    "positive": -3.4386162757873535
                },
                "status": "perfect match",
                "transcript_name": "Kenny Kenny Picket"
            },
            "Keon Coleman": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.371617317199707,
                            "neutral": -2.7279350757598877,
                            "positive": -1.5930203199386597
                        },
                        "text": "yes it's because they paid clear Shakir they didn't even pay him wide receiver one number they paid him wide receiver two to money and that's what Cleo Shakare really wins. So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid? I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around. I think for me even though he's tight end 26 last year um I think he has a chance to slide into that number one target role."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4635008",
                "sentiment_consensus": {
                    "negative": -4.371617317199707,
                    "neutral": -2.7279350757598877,
                    "positive": -1.5930203199386597
                },
                "status": "perfect match",
                "transcript_name": "Keon Coleman"
            },
            "Khalil Shakir": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.0499563217163086,
                            "neutral": -2.669801712036133,
                            "positive": -3.0380587577819824
                        },
                        "text": "and that's what Cleo Shakare really wins. So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid? I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around. I think for me even though he's tight end 26 last year um I think he has a chance to slide into that number one target role. So yes, am I being biased here?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5274548530578613,
                            "neutral": -3.3939104080200195,
                            "positive": -2.1740827560424805
                        },
                        "text": "This is going to be his make or break year. This is by all reports even out of like outside of the scout I talked to saying hey they want to make sure this offense is run through like don't look conc just comes down to can he stay healthy can he get separation for me and for me I think coming in this offense that's going to be you know a dominant offense out there they have no clear cut wide receiver one on this offense yes it's because they paid clear Shakir they didn't even pay him wide receiver one number they paid him wide receiver two to money and that's what Cleo Shakare really wins. So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid?"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4373678",
                "sentiment_consensus": {
                    "negative": -3.288705587387085,
                    "neutral": -3.031856060028076,
                    "positive": -2.6060707569122314
                },
                "status": "best of multiple matches",
                "transcript_name": "Shakir"
            },
            "Kyle Pitts Sr.": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.5972598791122437,
                            "neutral": -2.1734490394592285,
                            "positive": -3.5069003105163574
                        },
                        "text": "Okay. There's so many all the like when we talk about all those bunch of guys in the bottom there like a guy in Zachary, it's Hunter Henry. I feel more comfortable about all them than Kyle Pitts. Like I just I'm I'm done until I see it and I don't believe it."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.7370786666870117,
                            "neutral": -2.034947395324707,
                            "positive": -2.487724781036377
                        },
                        "text": "Oh, really? If they did, that's crazy because he was a top 10 pick, so they had to pay him top 10 pick fifth year option money, which is crazy on production. Yeah, I mean obviously he's besides his rookie year hasn't done anything that would indicate that you want the Atlanta Falcons picked up Kyle Pitt's fifth year contract option on April 29th. There's almost a 0% chance. Rich, there's a 0% chance already did it."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -5.070162296295166,
                            "neutral": -4.230280876159668,
                            "positive": -5.020834922790527
                        },
                        "text": "At 10 I have Mark Andrews. At 11 I have Hunter Henry. And at 12 I have Kyle Pitts. I thought about getting Hunter Henry in there. I you know it's a weird it's a weird range down there"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -2.320829391479492,
                            "neutral": -2.906477928161621,
                            "positive": -2.945556640625
                        },
                        "text": "So he's my outlier. I think everything else like we all had Mark Andrews in there. I think the only one that I didn't hear you guys say that I did have was Kyle Pitts. Did you Nobody had Kyle Pitts in there? I did not have."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.5873167514801025,
                            "neutral": -2.347933530807495,
                            "positive": -3.4830358028411865
                        },
                        "text": "I think everything else like we all had Mark Andrews in there. I think the only one that I didn't hear you guys say that I did have was Kyle Pitts. Did you Nobody had Kyle Pitts in there? I did not have. So"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.6099793910980225,
                            "neutral": -2.1932244300842285,
                            "positive": -3.4140257835388184
                        },
                        "text": "So yeah. So this is maybe not quite the same love, but Kyle Pitts is a player that Yes. He's been severely severely disappointing uh over over the course of the past three seasons, but we have a we have a new new sheriff in town."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.9678950309753418,
                            "neutral": -2.5270986557006836,
                            "positive": -1.6557368040084839
                        },
                        "text": "Yeah. compared to ADP. And it's the thing what Kyle Pitts cost you compared to what you give Hunter Henry for. It's like or Zach Ertz, you know what I mean? It's like Exactly."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.8279240131378174,
                            "neutral": -2.3655197620391846,
                            "positive": -2.3552637100219727
                        },
                        "text": "He's been severely severely disappointing uh over over the course of the past three seasons, but we have a we have a new new sheriff in town. We got a new quarterback in here. Um granted, it's what they should say, but all signs point to them saying like, \"No, we must get Kyle Pitts the football.\" Like, this is this is a must. He's the number two option in this offense."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.0827503204345703,
                            "neutral": -1.4538646936416626,
                            "positive": -3.3381383419036865
                        },
                        "text": "It's like Exactly. And once you're in that range, like what am I paying? And like if you still have Kyle Pitts, you're not definitely you'd rather just hope and hold on and go down with the ship, right? Like I might take a second, honestly. I don't think I would."
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "4360248",
                "sentiment_consensus": {
                    "negative": -2.4223550822999744,
                    "neutral": -2.4703107012642755,
                    "positive": -3.1341352330313788
                },
                "status": "perfect match",
                "transcript_name": "Kyle Pitts"
            },
            "Kyle Williams": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.280580520629883,
                            "neutral": -1.239735722541809,
                            "positive": -2.1436409950256348
                        },
                        "text": "If he's going to be getting that kind of volume in this offense, which it could maybe trickle down a little bit. Uh we do have Stefon Diggs there. We we do have Kyle Williams there now. So, it could drop a little bit, but I don't think it's going to drop significantly. I still think he's going to be inside the top eight or so at on targets."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4613202",
                "sentiment_consensus": {
                    "negative": -4.280580520629883,
                    "neutral": -1.239735722541809,
                    "positive": -2.1436409950256348
                },
                "status": "perfect match",
                "transcript_name": "Kyle Williams"
            },
            "Kyler Murray": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.663270473480225,
                            "neutral": -4.0723137855529785,
                            "positive": -2.722527027130127
                        },
                        "text": "It's only you be the first or second target in their offense. Obviously, uh you have Brock Bowers is number one target. Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense. George Kittle, if he's not number one, he's 1B, right? I think the same thing in David Njoku falls into the same line as if he's not 1A, he is 1B."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3917315",
                "sentiment_consensus": {
                    "negative": -4.663270473480225,
                    "neutral": -4.0723137855529785,
                    "positive": -2.722527027130127
                },
                "status": "perfect match",
                "transcript_name": "Kyler Murray"
            },
            "Mark Andrews": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.7273154258728027,
                            "neutral": -2.9858951568603516,
                            "positive": -3.1386451721191406
                        },
                        "text": "Just remind a little recap on that. We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry. And at 12 I have Kyle Pitts."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.514232873916626,
                            "neutral": -1.7609070539474487,
                            "positive": -1.4457021951675415
                        },
                        "text": "Uh but right now I'm going to be a little uh bearish on him even though I love him. So he's my outlier. I think everything else like we all had Mark Andrews in there. I think the only one that I didn't hear you guys say that I did have was Kyle Pitts. Did you Nobody had Kyle Pitts in there?"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -0.38398414850234985,
                            "neutral": -3.426835060119629,
                            "positive": -3.5546655654907227
                        },
                        "text": "All signs that like literally they were trying to extend him. They get hurt real bad. Despite all that and despite that, Mark Andrews fell off like real hard early in the game. I think the first Now, you remember he he did have that pre uh season car accident. So, he was hurt going to the season."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -0.8011557459831238,
                            "neutral": -1.9889318943023682,
                            "positive": -2.015716552734375
                        },
                        "text": "And if you want to get a part of that, just head to our Dynasty Nerds homepage, go under the store tab, and you'll find roster rescue right there. Perfect opportunity to get your rosters in shape before the season or even in the middle of the season to make sure that you can win a championship. Mark Andrew's on our list. You know,  somebody who's taking a big dump down is it really had to do with likely news. Sure."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.5282135009765625,
                            "neutral": -2.01049542427063,
                            "positive": -2.2627904415130615
                        },
                        "text": "Uh Travis Kelce at 10. So, we just picked a different rookie tight end together. Mark Andrews at 11. And I have Dalton Kincaid at 12. Makes sense."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.1178624629974365,
                            "neutral": -2.627793788909912,
                            "positive": -1.3609989881515503
                        },
                        "text": "Yeah. So, wait, who' you say was 11? Uh Mark Andrews. Okay. So, obviously all our outliers, Matt, Zach Ertz, go ahead."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.6059160232543945,
                            "neutral": -3.0602121353149414,
                            "positive": -2.2530746459960938
                        },
                        "text": "Now, now we see why George Kittle is below him in our in our GM tool. That might just be a function of We'll talk about that later. Um, Mark 10 10 Mark Andrews, 11 Zach Ertz. That's where I went a little crazy. Not a bad I had Zach Ertz written in."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.2167747020721436,
                            "neutral": -2.151405096054077,
                            "positive": -0.8800323605537415
                        },
                        "text": "So, he was hurt going to the season. Uh well, he didn't really start coming on until I think it was like week five or six. Mark Andrews finished as tight end six overall last year. Like, he was still a very solid. All the dude does is produce, man."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3116365",
                "sentiment_consensus": {
                    "negative": -2.48693186044693,
                    "neutral": -2.5015594512224197,
                    "positive": -2.1139532402157784
                },
                "status": "perfect match",
                "transcript_name": "Mark Andrews"
            },
            "Mason Taylor": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5116331577301025,
                            "neutral": -3.4373483657836914,
                            "positive": -1.2504760026931763
                        },
                        "text": "And like that's like like I felt good enough about it that I was like so I I didn't get any rookies in there, but do you want to know who I actually have projected as the highest rookie tight end? Mason Taylor. Mason Taylor. Mason Taylor."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.4440102577209473,
                            "neutral": -3.5401530265808105,
                            "positive": -1.6837714910507202
                        },
                        "text": "so I I didn't get any rookies in there, but do you want to know who I actually have projected as the highest rookie tight end? Mason Taylor. Mason Taylor. Mason Taylor. I mean, I can see that, too."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.955096960067749,
                            "neutral": -1.1384038925170898,
                            "positive": -1.03437077999115
                        },
                        "text": "Mason Taylor. Mason Taylor. Mason Taylor. I mean, I can see that, too. Yeah, no doubt."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4808766",
                "sentiment_consensus": {
                    "negative": -2.9702467918395996,
                    "neutral": -2.7053017616271973,
                    "positive": -1.3228727579116821
                },
                "status": "perfect match",
                "transcript_name": "Mason Taylor"
            },
            "Michael Pittman Jr.": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.3563079833984375,
                            "neutral": -2.7317707538604736,
                            "positive": -2.6868796348571777
                        },
                        "text": "All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often. So with those reports saying like we said, I like Josh Downs a ton. I like uh Michael Pitman as well. This is offense. I think they're going to want to keep the ball everything short and sweet."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4035687",
                "sentiment_consensus": {
                    "negative": -5.3563079833984375,
                    "neutral": -2.7317707538604736,
                    "positive": -2.6868796348571777
                },
                "status": "perfect match",
                "transcript_name": "Michael Pitman"
            },
            "RJ Harvey": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.1082563400268555,
                            "neutral": -2.013091802597046,
                            "positive": -2.0034937858581543
                        },
                        "text": "I have I'm at four. And obviously, it's on the back of, you know, all the talk this whole offseason about Tron Peyton wanting to get a Evan Engram and then him going out and kind of finding his guy, going out and saying, \"Hey, this is this is the guy that I want.\" Him and R.J. Harvey, which I think R.J. Harvey is going to have a role this year. I don't know that it's going to be as the Evan Engram yet. You know, I think that's kind of one of those things that he'll have to grow into if he if he does become the long term."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.5547924041748047,
                            "neutral": -2.3692784309387207,
                            "positive": -5.297266960144043
                        },
                        "text": "I don't know that it's going to be as the Evan Engram yet. You know, I think that's kind of one of those things that he'll have to grow into if he if he does become the long term. And RJ Harvey's not even going to play on third downs. Like, you know, it's Yeah, it sounds like his pass blocking is a big concern at this point. So, he'll really need to grow in order to become that kind of guy."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.786975860595703,
                            "neutral": -2.5877156257629395,
                            "positive": -3.3515055179595947
                        },
                        "text": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation"
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4568490",
                "sentiment_consensus": {
                    "negative": -3.4833415349324546,
                    "neutral": -2.323361953099569,
                    "positive": -3.550755421320597
                },
                "status": "perfect match",
                "transcript_name": "R.J. Harvey"
            },
            "Sam Acho": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.411167860031128,
                            "neutral": -3.1604363918304443,
                            "positive": -3.0509681701660156
                        },
                        "text": "Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart. like and I feel much more comfortable with that combination because I'm with you Matt"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "14152",
                "sentiment_consensus": {
                    "negative": -3.411167860031128,
                    "neutral": -3.1604363918304443,
                    "positive": -3.0509681701660156
                },
                "status": "best of multiple matches",
                "transcript_name": "Sam Sam"
            },
            "Sam LaPorta": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5931131839752197,
                            "neutral": -3.1729345321655273,
                            "positive": 0.3520788550376892
                        },
                        "text": "So he lost two targets per game because Jameson Williams took a big step up. What did we used to talk about with George Kittle? It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta. If he if one of those guys goes down and Sam LePorta all of a sudden gets more of the target share because those naturally they're just out of the offense, then yeah, he can bump way the heck up. He's got the talent to do it."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9193930625915527,
                            "neutral": -3.717428684234619,
                            "positive": 2.7226898670196533
                        },
                        "text": "What did we used to talk about with George Kittle? It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta. If he if one of those guys goes down and Sam LePorta all of a sudden gets more of the target share because those naturally they're just out of the offense, then yeah, he can bump way the heck up. He's got the talent to do it. It's just there's only one football and there's only so many targets to go around per year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.652259588241577,
                            "neutral": -3.023914337158203,
                            "positive": -2.5027709007263184
                        },
                        "text": "We've been talking about him a lot, so it doesn't surprise me. Yeah. So, like if I miss out on George Kittle to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam LePorta is going to usually go tight end four there. T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier. And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.0317893028259277,
                            "neutral": -2.279682159423828,
                            "positive": -3.2014541625976562
                        },
                        "text": "So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right? Because you could probably get David and David Njoku plus a first uh this year.\" And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson. Sam Sam or I'm sorry um David and David Njoku. Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.1019887924194336,
                            "neutral": -2.934950113296509,
                            "positive": -2.3642351627349854
                        },
                        "text": "I think, uh, you know, obviously this is a very crowded situation. Um, so that's going to be I think the biggest hurdle is to to get over is is to get the targets, but we've seen obviously rookies make a big impact in Ben Johnson's offense in the past. Sam Sam LePorta comes directly to mind his rookie year when he finished as I think tight end two or three. Um I can't remember it was he was tight end one at one point and I think I think he got passed in that year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5401110649108887,
                            "neutral": -1.7154266834259033,
                            "positive": -1.6835929155349731
                        },
                        "text": "like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent. It just comes down to the situation."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.000074625015259,
                            "neutral": -1.8698158264160156,
                            "positive": -1.1275501251220703
                        },
                        "text": "It's not on the amount of catches and yards he gets. I think it's the touchdowns is what I think he's I think you see double digit touchdowns this year. So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine. Okay. Uh Travis Kelce at 10."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.953341245651245,
                            "neutral": -3.6518266201019287,
                            "positive": -3.0886895656585693
                        },
                        "text": "It's a that it all comes down to system and why we love again Alvin Kamaro so much because of the system he plays and how he plays. It's not as do the players. So, is there a path for Sam LePorta to join those elite guys again? Definitely as like some of these other guys start to age out. 100%."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.2328591346740723,
                            "neutral": -0.9418829083442688,
                            "positive": -2.580341339111328
                        },
                        "text": "Definitely as like some of these other guys start to age out. 100%. But as things stand now, Sam LePorta to me fits right where he finished last year. tight end seven, tight end eight. Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.530851125717163,
                            "neutral": -3.8287956714630127,
                            "positive": -1.941279411315918
                        },
                        "text": "tight end seven, tight end eight. Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus and I get a significant plus than having Sam Sam LePorta. Now, can I settle with Sam LePorta in Dynasty? Oh, I'm very happy to have him because if I have Titan 7, Titan 8, Tight end six, year in year out, like I feel very comfortable, but again, I'm trying to build the best roster possible to score the highest points, not settle, right?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.4753665924072266,
                            "neutral": -3.620108127593994,
                            "positive": -1.6865267753601074
                        },
                        "text": "Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus and I get a significant plus than having Sam Sam LePorta. Now, can I settle with Sam LePorta in Dynasty? Oh, I'm very happy to have him because if I have Titan 7, Titan 8, Tight end six, year in year out, like I feel very comfortable, but again, I'm trying to build the best roster possible to score the highest points, not settle, right? No, it makes perfect sense."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.109473705291748,
                            "neutral": 0.4016921818256378,
                            "positive": -0.5222312211990356
                        },
                        "text": "so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you. I have him in my own tier, but like if he finishes tight end five, um if Sam LePorta was tight end five, if Tucker Tucker Kraft was tight end five, that does not shock me. So even though I have T.J. Hockenson at six, I'm with you in the tier group. Five through like eight to me are pretty close."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.459158182144165,
                            "neutral": -2.8042025566101074,
                            "positive": -3.0428528785705566
                        },
                        "text": "Do you want six through 12? Just remind a little recap on that. We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.7648764848709106,
                            "neutral": -2.1359939575195312,
                            "positive": -2.4544856548309326
                        },
                        "text": "so I I I see him in a very positive light. Uh and then for me, I have at seven, I have Sam LePorta. Yep. And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam LePorta he's the 51st guy off the board then when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is"
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -2.1065001487731934,
                            "neutral": -2.5453996658325195,
                            "positive": -3.1270267963409424
                        },
                        "text": "Uh and then for me, I have at seven, I have Sam LePorta. Yep. And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam LePorta he's the 51st guy off the board then when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is 82 Tucker Tucker Kraft's 108 um so"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.038433074951172,
                            "neutral": -2.8304338455200195,
                            "positive": -1.4452775716781616
                        },
                        "text": "82 Tucker Tucker Kraft's 108 um so I mean he's significantly ahead of those guys so for me Sam Sam LePorta This is not a knock on him as a player. I think he's a very, very talented player."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.589828014373779,
                            "neutral": -4.856830596923828,
                            "positive": -2.979544162750244
                        },
                        "text": "Tighten eight. So, I mean, I came on a show six months ago and I brought this up and I said, \"Man, one of my biggest sells right now and tight end premium or in fantasy right now is Sam LePorta.\" We talked about that a lot on roster rescue as well. And I said, this has nothing to do with Sam LePorta."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.2472944259643555,
                            "neutral": -4.117393493652344,
                            "positive": 0.12160385400056839
                        },
                        "text": "and I said, \"Man, one of my biggest sells right now and tight end premium or in fantasy right now is Sam LePorta.\" We talked about that a lot on roster rescue as well. And I said, this has nothing to do with Sam LePorta. I think he's a super talented tight end. I was like, my point is he finishes tight end eight this year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.927415132522583,
                            "neutral": -2.0841243267059326,
                            "positive": -1.17525315284729
                        },
                        "text": "I think he's a super talented tight end. I was like, my point is he finishes tight end eight this year. I feel going forward Sam LePorta, which is again a very solid asset to own, is gonna live in tight end six to eight range consistently. Um, and the reason why is I still have some my notes back here from early like six months ago and it says what happened to his targets per game. It went from seven to five."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4430027",
                "sentiment_consensus": {
                    "negative": -3.435480362490604,
                    "neutral": -2.722602732871708,
                    "positive": -1.669828380016904
                },
                "status": "perfect match",
                "transcript_name": "Sam LePorta"
            },
            "Sean Chandler": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.17104434967041,
                            "neutral": -2.620556116104126,
                            "positive": -2.2393507957458496
                        },
                        "text": "I got tingles. That was like a Jeopardy thing. He reads it wrong to Sean. Sean Connor analyst. Can I have the butt experts, please?"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.5194427967071533,
                            "neutral": -2.70500111579895,
                            "positive": -3.4767494201660156
                        },
                        "text": "Sean Connor analyst. Can I have the butt experts, please? Uh, that's analyst Sean. Ah, shut up, Tbec. So, we're back next week with those."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3138733",
                "sentiment_consensus": {
                    "negative": -3.3452435731887817,
                    "neutral": -2.662778615951538,
                    "positive": -2.8580501079559326
                },
                "status": "best of multiple matches",
                "transcript_name": "Sean"
            },
            "Shedeur Sanders": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.450994491577148,
                            "neutral": -1.956316351890564,
                            "positive": -2.412034511566162
                        },
                        "text": "I think they're going to want to see what they have in Dillon Gabriel because like if they they spend a third round pick on him. I I've been kind of hammering this all along, right? Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback. I mean I said it when they drafted him that dude can run the offense right now and he looks like he can run the offense right now. He looks good."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4432762",
                "sentiment_consensus": {
                    "negative": -4.450994491577148,
                    "neutral": -1.956316351890564,
                    "positive": -2.412034511566162
                },
                "status": "perfect match",
                "transcript_name": "Shadur Sanders"
            },
            "Solomon Ajayi": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.205430507659912,
                            "neutral": -1.9901200532913208,
                            "positive": -1.579927682876587
                        },
                        "text": "Or replaces Travis Kelce. You know what I mean? Solomon knows. I thought that's what you were going to say. We've been trying to play for years forever."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4246885",
                "sentiment_consensus": {
                    "negative": -3.205430507659912,
                    "neutral": -1.9901200532913208,
                    "positive": -1.579927682876587
                },
                "status": "best of multiple matches",
                "transcript_name": "Solomon"
            },
            "Stefon Diggs": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.347797393798828,
                            "neutral": -1.4895521402359009,
                            "positive": -2.2677807807922363
                        },
                        "text": "He was fifth last year, fifth in targets. If he's going to be getting that kind of volume in this offense, which it could maybe trickle down a little bit. Uh we do have Stefon Diggs there. We we do have Kyle Williams there now. So, it could drop a little bit, but I don't think it's going to drop significantly."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "2976212",
                "sentiment_consensus": {
                    "negative": -4.347797393798828,
                    "neutral": -1.4895521402359009,
                    "positive": -2.2677807807922363
                },
                "status": "perfect match",
                "transcript_name": "Stefon Diggs"
            },
            "T.J. Hockenson": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.6826369762420654,
                            "neutral": -1.3429890871047974,
                            "positive": -1.2106736898422241
                        },
                        "text": "Yeah. So, like if I miss out on George Kittle to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam LePorta is going to usually go tight end four there. T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier. And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys. This is the guy who I believe it is and it's my tight end four, David and David Njoku."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.4488296508789062,
                            "neutral": -3.171292304992676,
                            "positive": -1.4583286046981812
                        },
                        "text": "It's why I w I thought about putting T.J. Hockenson higher. For some reason, in my head, I only had it down as two. So, that's crazy."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.533904552459717,
                            "neutral": -2.522780418395996,
                            "positive": -2.675137519836426
                        },
                        "text": "Do you want six through 12? Just remind a little recap on that. We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.409515380859375,
                            "neutral": -1.4077965021133423,
                            "positive": -1.8412986993789673
                        },
                        "text": "Oh yeah, Evan Engram four Jou five and then Travis G. So who did you have? I have T.J. Hockenson at six. I have T.J. Hockenson at six as well. Okay."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.5072715282440186,
                            "neutral": -1.786842942237854,
                            "positive": -2.033742904663086
                        },
                        "text": "So who did you have? I have T.J. Hockenson at six. I have T.J. Hockenson at six as well. Okay. Where do you have T.J. Hockenson?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.745248317718506,
                            "neutral": -3.6257989406585693,
                            "positive": -2.0614218711853027
                        },
                        "text": "Yeah. So, I mean, we could see we could obviously see T.J. Hockenson being much higher than where I have him. And and I think, you know, it was just more of a factor of getting other guys in above him and kind of at the end going, I need to get um T.J. Hockenson into this top 12. Where does he fit? Um"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.400043249130249,
                            "neutral": -1.8166289329528809,
                            "positive": -2.2830252647399902
                        },
                        "text": "I have T.J. Hockenson at six as well. Okay. Where do you have T.J. Hockenson? Um 12. Oh wow."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7689170837402344,
                            "neutral": -3.5267815589904785,
                            "positive": -0.5941383242607117
                        },
                        "text": "Now that he's more than a full year removed from his injury, the fact that he's gonna be able to slide in as a number two target in this offense, um I think it'll kind of help propel him, build that rapport, JJ McCarthy, be again, we always talk about these rookie quarterbacks, like always one of their safety nets. It's usually the tight end. I think T.J. Hockenson kind of felt um find himself in that position. I think Kevin Okonnell could trust T.J. Hockenson enough to be JJ safety enough as well on top of having a guy like Justin Jefferson. So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.9117274284362793,
                            "neutral": -1.6090041399002075,
                            "positive": -0.3674135208129883
                        },
                        "text": "It's not on the amount of catches and yards he gets. I think it's the touchdowns is what I think he's I think you see double digit touchdowns this year. So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine. Okay. Uh Travis Kelce at 10."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.4002456665039062,
                            "neutral": -1.7595664262771606,
                            "positive": -1.432096242904663
                        },
                        "text": "Um and I I just felt really good about my other guys. So that's why T.J. Hockenson ended up 12. I think it's Yeah, it's three games. It's three games."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.150796890258789,
                            "neutral": -1.8186595439910889,
                            "positive": -3.6119086742401123
                        },
                        "text": "I mean yeah. Um, no, I don't have a lot of con I don't have a lot of conviction about about T.J. Hockenson here at 12. Um, he was tight end 12 on the year last year. Only only played 10 games."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.759183406829834,
                            "neutral": -1.4867111444473267,
                            "positive": -2.074216365814209
                        },
                        "text": "And that's why I said like six through eight I feel more comfortable interchanging. But at the same time, those guys could easily jump up for me. So I do like you have T.J. Hockenson at six as well. I have T.J. Hockenson at six as well. And yeah, I echo a lot of the same things you do."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.1960763931274414,
                            "neutral": -1.4953316450119019,
                            "positive": -1.0449731349945068
                        },
                        "text": "But at the same time, those guys could easily jump up for me. So I do like you have T.J. Hockenson at six as well. I have T.J. Hockenson at six as well. And yeah, I echo a lot of the same things you do. It just comes down to the to the player himself."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4036133",
                "sentiment_consensus": {
                    "negative": -2.83956896341764,
                    "neutral": -2.1053987374672523,
                    "positive": -1.7452596013362591
                },
                "status": "perfect match",
                "transcript_name": "T.J. Hockenson"
            },
            "Taylor Bertolet": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.547961235046387,
                            "neutral": -3.167053699493408,
                            "positive": -3.773939609527588
                        },
                        "text": "He's going to be engaged. So he got engaged today, but I did I not say this podcast a month ago. My birdie had told me that Travis and Taylor would be getting engaged soon. Yeah, you did say that. Did I not say that?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9884753227233887,
                            "neutral": -4.483779430389404,
                            "positive": -2.2411296367645264
                        },
                        "text": "but yeah you have we are the official Taylor Swift podcast obviously. Come on join my podcast. Taylor I to be honest with you everything I've heard about her is like first of all my wife wanted to watch that podcast when she was on New Heights. I thought she came out absolutely fantastic."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "2578718",
                "sentiment_consensus": {
                    "negative": -4.268218278884888,
                    "neutral": -3.8254165649414062,
                    "positive": -3.007534623146057
                },
                "status": "best of multiple matches",
                "transcript_name": "Taylor"
            },
            "Terry Beckner Jr.": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.304656028747559,
                            "neutral": -2.504762887954712,
                            "positive": -2.279961109161377
                        },
                        "text": "I just I I I think this is a great offense. Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year. really hasn't come together for Ben um yet and had a rough camper I heard rather yeah"
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "3924310",
                "sentiment_consensus": {
                    "negative": -5.304656028747559,
                    "neutral": -2.504762887954712,
                    "positive": -2.279961109161377
                },
                "status": "best of multiple matches",
                "transcript_name": "Terry"
            },
            "Thomas Booker IV": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.244235515594482,
                            "neutral": -4.046827793121338,
                            "positive": -4.029067039489746
                        },
                        "text": "Yeah. So, he's still putting up borderline number one overall tight end numbers just with any random quarterback last year. Jameus Winston, uh, Thomas, uh, I even forget his name now. Thompson Robinson, Dorian Thompson Robinson, the worst quarterback I've ever seen play in. Yeah, terrible."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4360749",
                "sentiment_consensus": {
                    "negative": -4.244235515594482,
                    "neutral": -4.046827793121338,
                    "positive": -4.029067039489746
                },
                "status": "best of multiple matches",
                "transcript_name": "Thomas"
            },
            "Travis Bell": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.493448257446289,
                            "neutral": -3.1977012157440186,
                            "positive": -3.8063669204711914
                        },
                        "text": "He's going to be engaged. So he got engaged today, but I did I not say this podcast a month ago. My birdie had told me that Travis and Taylor would be getting engaged soon. Yeah, you did say that. Did I not say that?"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.55381441116333,
                            "neutral": -2.8569443225860596,
                            "positive": -3.2583680152893066
                        },
                        "text": "Because we have our Oh, yeah. So you have I think my Evan Engram was or no? Oh yeah, Evan Engram four Jou five and then Travis G. So who did you have? I have T.J. Hockenson at six."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4246741",
                "sentiment_consensus": {
                    "negative": -4.02363133430481,
                    "neutral": -3.027322769165039,
                    "positive": -3.532367467880249
                },
                "status": "best of multiple matches",
                "transcript_name": "Travis"
            },
            "Travis Kelce": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.496610403060913,
                            "neutral": -2.659839153289795,
                            "positive": -1.786442518234253
                        },
                        "text": "Any another slight down tick from his production like we saw last year where everything was down, right? Um it just moves him from tight end five to tight end 10 because it's it's that close on a point per game basis. Where do you have tight end uh Travis Kelce Matt? Six. Oh, so pretty high."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.4995335340499878,
                            "neutral": -1.7421674728393555,
                            "positive": -2.002375364303589
                        },
                        "text": "Yeah. There. Or replaces Travis Kelce. You know what I mean? Solomon knows."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.8310786485671997,
                            "neutral": -2.1001431941986084,
                            "positive": -2.841090679168701
                        },
                        "text": "You can't you can't mess with that. Yeah. So, um you have Travis Kelce at five. I actually have not at 10. Okay."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.213931918144226,
                            "neutral": -1.6431916952133179,
                            "positive": -1.3949121236801147
                        },
                        "text": "Where Rashee Rice wins like he's not like a take the top off defense like he wins in the middle of field, right? Like the short crossing routes are his bread and butter. So, I think he takes away from Travis Kelce is what it is. So, I still have a tight end 10. If you finished higher, not surprised because like you said, my tight end from tight end eight down."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.118762016296387,
                            "neutral": -2.074042797088623,
                            "positive": -1.246289849281311
                        },
                        "text": "oh he's tight end 12 again like it could easily be love at 12 but anyways who's your sixth through 12. All right 6 through 12 I went uh Travis Kelce Sam Sam LePorta at seven at eight I went Colston Loveland. Whoa. Yeah."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.5694663524627686,
                            "neutral": -2.1698102951049805,
                            "positive": -2.211413860321045
                        },
                        "text": "So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine. Okay. Uh Travis Kelce at 10. So, we just picked a different rookie tight end together. Mark Andrews at 11."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.30576753616333,
                            "neutral": -2.1013941764831543,
                            "positive": -1.759663701057434
                        },
                        "text": "So, Garrett, who is your five? So, my five, I actually went back to Old Faithful. Uh, I put Travis Kelce there. Uh, I think the thoughts of his demise were overblown last year. He was tight end five last year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.307790756225586,
                            "neutral": -4.013707637786865,
                            "positive": -1.5117722749710083
                        },
                        "text": "And and you know, given, you know, that some of these guys, you know, George Kittle's a little bit older. Evan Engram's a little bit older. Travis Kelce obviously a little bit older. He's a guy that we're going to be having to have the conversation, you know, is he this next guy that's going to be able to get a tier if if Green Bay's wide receivers kind of start to dissipate in the next couple of seasons or even just solidify who's who and well, what's what's the roles there? I I mentioned it when we were doing all the division breakdowns."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": 2.07092022895813,
                            "neutral": -4.361506462097168,
                            "positive": -3.355829954147339
                        },
                        "text": "Right. So, for me, it's just I think the Rashee Rice effect is what's going to take away from Travis Kelce just enough because it is so close. Just kind of we talked about before the light tight ends or the receivers. It's just so close."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "15847",
                "sentiment_consensus": {
                    "negative": -2.25244677066803,
                    "neutral": -2.5406447649002075,
                    "positive": -2.0121989250183105
                },
                "status": "perfect match",
                "transcript_name": "Travis Kelce"
            },
            "Trey McBride": {
                "average_label": "neutral",
                "detailed_sentiment": [
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -1.22136390209198,
                            "neutral": -1.1124300956726074,
                            "positive": -2.238636016845703
                        },
                        "text": "Yeah, understandable. Sure. Trey Trey McBride 27. Uhhuh. 10 picks later, George Kittle 38."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.070112943649292,
                            "neutral": -2.628800868988037,
                            "positive": -2.336946487426758
                        },
                        "text": "That's the value. Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go. Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is. instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle. Let me ask you this, though."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.588094711303711,
                            "neutral": -1.8538011312484741,
                            "positive": -2.9704298973083496
                        },
                        "text": "True. Just mind you that. So Brock Bowers one, George Kittle two, Trey Trey McBride three. I just I went chalky chalk. I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.5276546478271484,
                            "neutral": -2.075267791748047,
                            "positive": -2.523914098739624
                        },
                        "text": "So Brock Bowers one, George Kittle two, Trey Trey McBride three. I just I went chalky chalk. I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish. But I mean, you know, it's it is what it is. These guys, you can't go wrong with either one of these."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -5.602674961090088,
                            "neutral": -3.9330077171325684,
                            "positive": -2.452263593673706
                        },
                        "text": "It's only you be the first or second target in their offense. Obviously, uh you have Brock Bowers is number one target. Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense. George Kittle, if he's not number one, he's 1B, right? I think the same thing in David Njoku falls into the same line as if he's not 1A, he is 1B."
                    }
                ],
                "most_frequent_label": "neutral",
                "player_id": "4361307",
                "sentiment_consensus": {
                    "negative": -3.201980233192444,
                    "neutral": -2.320661520957947,
                    "positive": -2.504438018798828
                },
                "status": "perfect match",
                "transcript_name": "Trey McBride"
            },
            "Tucker Kraft": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.5766634941101074,
                            "neutral": -3.1688427925109863,
                            "positive": -0.568516731262207
                        },
                        "text": "So, I I think I think there's going to be a conversation, you know, about Tucker Tucker Kraft. Is he is he talented enough to be a top four guy in a couple of seasons? So, this might be a nice opportunity while he's kind of had has a little bit of a depressed um value to kind of go out and say, \"Hey, let's let's make some moves for Tucker Kraft now because in two or three years, he's going to be a guy that's kind of up in this other echelon um nipping at at heels of the top tier.\" He is a great That's a really good point from a D perspective. He's probably one of the best high upside buys at the position."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.941469430923462,
                            "neutral": -1.9825806617736816,
                            "positive": -3.3505661487579346
                        },
                        "text": "He's probably one of the best high upside buys at the position. Yeah, absolutely. Yeah, and I don't I don't have much to add on Tucker Tucker Kraft. I echo what you guys say. I think he's a good player that's in a little bit of a messy situation, but the talent overrides that for me, and so I'm willing any guy in this range is a risk, but he's a guy that I'm willing to take the risk on."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.7463440895080566,
                            "neutral": -3.091637134552002,
                            "positive": -3.365105152130127
                        },
                        "text": "Do you want six through 12? Just remind a little recap on that. We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine. At 10 I have Mark Andrews. At 11 I have Hunter Henry."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -3.161748170852661,
                            "neutral": -3.4200663566589355,
                            "positive": -4.153388500213623
                        },
                        "text": "Yep. And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam LePorta he's the 51st guy off the board then when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is 82 Tucker Tucker Kraft's 108 um so I mean he's significantly ahead of those guys so for me Sam Sam LePorta"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.8326826095581055,
                            "neutral": -4.137280464172363,
                            "positive": -1.876037359237671
                        },
                        "text": "He said, you know, he said, \"If there's an area we got to do better at, it's featuring the tight end.\" And we saw last year that this offense targeted the tight ends 25% of the time. Um, when you have somebody who in her first year as being the main guy there excel uh with the ball in his hands like Tucker Tucker Kraft did, I see why he would say something like that with such a poperri of mystery at the receiver position. It's kind of playing out. I think in the end it could be somebody like Tucker Tucker Kraft is the most valuable receiving weapon we see in that offense."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -4.025345325469971,
                            "neutral": -1.680448055267334,
                            "positive": -1.7964427471160889
                        },
                        "text": "but it just hasn't and he's still he's still putting up numbers. All right let's talk two rookies then we'll finish it off with Tucker Tucker Kraft talk. Sounds good. Okay."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.0316057205200195,
                            "neutral": -4.193031311035156,
                            "positive": -1.5017977952957153
                        },
                        "text": "Um, when you have somebody who in her first year as being the main guy there excel uh with the ball in his hands like Tucker Tucker Kraft did, I see why he would say something like that with such a poperri of mystery at the receiver position. It's kind of playing out. I think in the end it could be somebody like Tucker Tucker Kraft is the most valuable receiving weapon we see in that offense. So, I think we're all like pretty comfortable because he finished the tight end eight last year. No reason not to do that."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.236706256866455,
                            "neutral": -2.1911070346832275,
                            "positive": -1.3571964502334595
                        },
                        "text": "It's not on the amount of catches and yards he gets. I think it's the touchdowns is what I think he's I think you see double digit touchdowns this year. So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine. Okay. Uh Travis Kelce at 10."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.8777103424072266,
                            "neutral": -3.197734832763672,
                            "positive": 0.5424076914787292
                        },
                        "text": "Yep. But he's the kind of guy like I said, right? I ended at eight for Tucker Kraft for a reason because that was the last guy I saw that could propel up to like as high as five and it wouldn't shock me in the least. Yeah, he's super talented, man. And and you know, given, you know, that some of these guys, you know, George Kittle's a little bit older."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.357628345489502,
                            "neutral": -2.6851296424865723,
                            "positive": -1.5802115201950073
                        },
                        "text": "So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high but like I said when I get to tight end 678 so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you. I have him in my own tier, but like if he finishes tight end five, um if Sam LePorta was tight end five, if Tucker Tucker Kraft was tight end five, that does not shock me."
                    },
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -2.0124497413635254,
                            "neutral": -2.10927677154541,
                            "positive": -2.162487030029297
                        },
                        "text": "I was like I told you you loved him. I love him. I was like, uh, number nine, Tucker Tucker Kraft. Now, now we see why George Kittle is below him in our in our GM tool. That might just be a function of We'll talk about that later."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.4372963905334473,
                            "neutral": -1.0157982110977173,
                            "positive": -0.9366025924682617
                        },
                        "text": "so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you. I have him in my own tier, but like if he finishes tight end five, um if Sam LePorta was tight end five, if Tucker Tucker Kraft was tight end five, that does not shock me. So even though I have T.J. Hockenson at six, I'm with you in the tier group. Five through like eight to me are pretty close."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.63425612449646,
                            "neutral": -3.380241870880127,
                            "positive": -2.9567606449127197
                        },
                        "text": "Yep. I went I went 678. Uh before we give because I know we're gonna talk about Tucker Tucker Kraft. You went to six. I I"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.3530020713806152,
                            "neutral": -3.991766929626465,
                            "positive": -1.2594146728515625
                        },
                        "text": "They have a lot of guys that are coming up on contract years. So, they it's not going to be the same thing in two years in Green Bay than it is right now. So, I I think I think there's going to be a conversation, you know, about Tucker Tucker Kraft. Is he is he talented enough to be a top four guy in a couple of seasons? So, this might be a nice opportunity while he's kind of had has a little bit of a depressed um value to kind of go out and say, \"Hey, let's let's make some moves for Tucker Kraft now because in two or three years, he's going to be a guy that's kind of up in this other echelon um nipping at at heels of the top tier.\""
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.516291379928589,
                            "neutral": -3.8797924518585205,
                            "positive": -1.5640761852264404
                        },
                        "text": "But as things stand now, Sam LePorta to me fits right where he finished last year. tight end seven, tight end eight. Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus and I get a significant plus than having Sam Sam LePorta. Now, can I settle with Sam LePorta in Dynasty?"
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -2.808767318725586,
                            "neutral": -1.9904431104660034,
                            "positive": -2.597177028656006
                        },
                        "text": "Yeah. A ton. And then um so it leaves us with Tucker Tucker Kraft. Uh I had him an eight. Matt, you had him at nine."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4572680",
                "sentiment_consensus": {
                    "negative": -3.346872925758362,
                    "neutral": -2.882198601961136,
                    "positive": -1.905210804194212
                },
                "status": "perfect match",
                "transcript_name": "Tucker Craft"
            },
            "Tyler Warren": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.53688907623291,
                            "neutral": -2.0446174144744873,
                            "positive": -1.2698711156845093
                        },
                        "text": "And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Coulson Lovelin is very good at. I think I think it's going to be kind of a glove inhand fit with with Coulson Lovelin, the young quarterback, and this offense. I kind of felt that way about Tyler Warren. We saw him, he's coming out of Penn State. We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.509389400482178,
                            "neutral": -4.168685436248779,
                            "positive": -3.0071651935577393
                        },
                        "text": "I kind of felt that way about Tyler Warren. We saw him, he's coming out of Penn State. We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career. Um coming off a year at Penn State where he had 104 catches uh for over,200 yards out there. All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -4.542162895202637,
                            "neutral": -4.056048393249512,
                            "positive": -2.8547661304473877
                        },
                        "text": "We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career. Um coming off a year at Penn State where he had 104 catches uh for over,200 yards out there. All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often. So with those reports saying like we said, I like Josh Downs a ton. I like uh Michael Pitman as well."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.7155847549438477,
                            "neutral": -3.281672477722168,
                            "positive": -0.03733624145388603
                        },
                        "text": "Help Daniel Jones out on his roll out who's the athletic tight end. And I think they're going to find ways to make sure that he's either the first or second look in this offense. So, for me, I think Tyler Warren, just because of target share alone, how many catches he's going to get this year, is going to finish as a tight end one. Uh, a lot of guys you could switch him out for, but I want to sneak one. I I"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.323129415512085,
                            "neutral": -2.019498348236084,
                            "positive": -1.2847362756729126
                        },
                        "text": "Eight. Eight. And I have Tyler Warren at nine. So, um I was telling Garrett on the uh fantasy roster rescue show like God, why is this George Kittle thing off? And then he looked it up."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4431459",
                "sentiment_consensus": {
                    "negative": -3.7254311084747314,
                    "neutral": -3.114104413986206,
                    "positive": -1.690774991363287
                },
                "status": "perfect match",
                "transcript_name": "Tyler Warren"
            },
            "Wilson Huber": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.238513946533203,
                            "neutral": -1.94727623462677,
                            "positive": -1.4878507852554321
                        },
                        "text": "Yeah, no doubt. Nobody there to catch the football outside of Garrett Wilson. Wilson and him. Baron. Yes."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4239107",
                "sentiment_consensus": {
                    "negative": -3.238513946533203,
                    "neutral": -1.94727623462677,
                    "positive": -1.4878507852554321
                },
                "status": "best of multiple matches",
                "transcript_name": "Wilson"
            },
            "Zach Ertz": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.685516119003296,
                            "neutral": -2.699594497680664,
                            "positive": -1.823122501373291
                        },
                        "text": "Jake Ferguson has a chance like all those guys are all sitting there. Hunter Henry, I was like, dude, a very clear path for him to be the number two target there. Zach Ertz was another guy getting in there. I settle Dalton Kincaid. I think it's pretty clear and obvious this is a player, former first round pick, enters year three year."
                    },
                    {
                        "best_label": "neutral",
                        "scores": {
                            "negative": -3.446071147918701,
                            "neutral": -1.9989687204360962,
                            "positive": -2.2522926330566406
                        },
                        "text": "compared to ADP. And it's the thing what Kyle Pitts cost you compared to what you give Hunter Henry for. It's like or Zach Ertz, you know what I mean? It's like Exactly. And once you're in that range, like what am I paying?"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -1.7577670812606812,
                            "neutral": -3.8980727195739746,
                            "positive": 0.06859781593084335
                        },
                        "text": "Uh Mark Andrews. Okay. So, obviously all our outliers, Matt, Zach Ertz, go ahead. You want to talk about Zach Ertz real quick? I mean, I we we basically touched on it."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "15835",
                "sentiment_consensus": {
                    "negative": -2.9631181160608926,
                    "neutral": -2.865545312563578,
                    "positive": -1.3356057728330295
                },
                "status": "perfect match",
                "transcript_name": "Zach Ertz"
            },
            "Zachary Carter": {
                "average_label": "negative",
                "detailed_sentiment": [
                    {
                        "best_label": "negative",
                        "scores": {
                            "negative": -1.7365813255310059,
                            "neutral": -2.107487678527832,
                            "positive": -2.3781776428222656
                        },
                        "text": "Uh, some former Rams guy. Okay. There's so many all the like when we talk about all those bunch of guys in the bottom there like a guy in Zachary, it's Hunter Henry. I feel more comfortable about all them than Kyle Pitts. Like I just I'm I'm done until I see it"
                    }
                ],
                "most_frequent_label": "negative",
                "player_id": "4240619",
                "sentiment_consensus": {
                    "negative": -1.7365813255310059,
                    "neutral": -2.107487678527832,
                    "positive": -2.3781776428222656
                },
                "status": "perfect match",
                "transcript_name": "Zachary"
            },
            "Zack Annexstad": {
                "average_label": "positive",
                "detailed_sentiment": [
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.9847636222839355,
                            "neutral": -3.351806640625,
                            "positive": -3.2302536964416504
                        },
                        "text": "And I had to take him out for my 11 guy because there's no way I was not going to put my 12th guy in. Um, I know who that is. But I had Zach Ertz written in. Okay. All right."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.096862316131592,
                            "neutral": -4.309828758239746,
                            "positive": -2.0178163051605225
                        },
                        "text": "Okay. So, obviously all our outliers, Matt, Zach Ertz, go ahead. You want to talk about Zach Ertz real quick? I mean, I we we basically touched on it. I just I I"
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -2.840954065322876,
                            "neutral": -2.055988073348999,
                            "positive": -1.7587889432907104
                        },
                        "text": "I still think the Debo I I still think I still think he gets enough. I think I think where Zach Ertz gets there is. It's not on the amount of catches and yards he gets. I think it's the touchdowns is what I think he's I think you see double digit touchdowns this year."
                    },
                    {
                        "best_label": "positive",
                        "scores": {
                            "negative": -3.414069652557373,
                            "neutral": -4.71750545501709,
                            "positive": -3.3753631114959717
                        },
                        "text": "Um, Mark 10 10 Mark Andrews, 11 Zach Ertz. That's where I went a little crazy. Not a bad I had Zach Ertz written in. Yeah. And I had to take him out for my 11 guy because there's no way I was not going to put my 12th guy in."
                    }
                ],
                "most_frequent_label": "positive",
                "player_id": "4360936",
                "sentiment_consensus": {
                    "negative": -3.084162414073944,
                    "neutral": -3.6087822318077087,
                    "positive": -2.5955555140972137
                },
                "status": "best of multiple matches",
                "transcript_name": "Zack"
            }
        }
        const playersSortedByMentions = getSortedKeys(results)
        setSortedPlayers(playersSortedByMentions);
        setAnalysisResult(results)
    }

    async function callAPI() {
        setLoading(true);
        console.log("calling api")
        // const response = await getNFLPlayers();
        // const response = await getPlayerObjectForAnalysis(submittedText);
        const response = await performAnalysis(submittedText);
        console.log("response: ", response);
        setAnalysisResult(response.data);
        setLoading(false);
    }

    async function analyze() {
        console.log("in analyze")

        const final_player_object = {
            "Aaron Adeoye": {
                "mentioned_sentence_indexes": [
                    314
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Aaron Adeoye",
                        "original sentence": "And here we are just a month later in Aaron engage.",
                        "player_id": "3910148",
                        "score": 100,
                        "sentence": "And here we are just a month later in Aaron Adeoye engage.",
                        "sentence_index": 314,
                        "status": "best of multiple matches",
                        "transcript_name": "Aaron"
                    }
                ]
            },
            "Alvin Kamara": {
                "mentioned_sentence_indexes": [
                    506
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Alvin Kamara",
                        "original sentence": "It's a that it all comes down to system and why we love again Alvin Kamaro so much because of the system he plays and how he plays.",
                        "player_id": "3054850",
                        "score": 92,
                        "sentence": "It's a that it all comes down to system and why we love again Alvin Kamara so much because of the system he plays and how he plays.",
                        "sentence_index": 506,
                        "status": "perfect match",
                        "transcript_name": "Alvin Kamaro"
                    }
                ]
            },
            "Ben Banogu": {
                "mentioned_sentence_indexes": [
                    636
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Ben Banogu",
                        "original sentence": "really hasn't come together for Ben um yet and had a rough camper I heard rather yeah even even in camp hasn't been great so I think that's going to make them kind of rely on Z even more John Bates is a fine tight end he's just not going to be a factor in the pass catching realm and Z had a really good kick right and Z has looked great so um I think you know last year he was at tight end seven and this is actually a step back you know what I mean getting him in at tight end 11 just because I think there is going to be some sort of negative effect with with Debo being there I just don't think it's I think it can be offset by things like like like touchdowns.",
                        "player_id": "3124970",
                        "score": 100,
                        "sentence": "really hasn't come together for Ben Banogu um yet and had a rough camper I heard rather yeah even even in camp hasn't been great so I think that's going to make them kind of rely on Z even more John Bates is a fine tight end he's just not going to be a factor in the pass catching realm and Z had a really good kick right and Z has looked great so um I think you know last year he was at tight end seven and this is actually a step back you know what I mean getting him in at tight end 11 just because I think there is going to be some sort of negative effect with with Debo being there I just don't think it's I think it can be offset by things like like like touchdowns.",
                        "sentence_index": 636,
                        "status": "best of multiple matches",
                        "transcript_name": "Ben"
                    }
                ]
            },
            "Ben Sinnott": {
                "mentioned_sentence_indexes": [
                    635
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Ben Sinnott",
                        "original sentence": "Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year.",
                        "player_id": "4690923",
                        "score": 100,
                        "sentence": "Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year.",
                        "sentence_index": 635,
                        "status": "perfect match",
                        "transcript_name": "Ben Sinnott"
                    }
                ]
            },
            "Bijan Robinson": {
                "mentioned_sentence_indexes": [
                    710
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Bijan Robinson",
                        "original sentence": "besides Bijan Robinson, who is actually the number two.",
                        "player_id": "4430807",
                        "score": 100,
                        "sentence": "besides Bijan Robinson, who is actually the number two.",
                        "sentence_index": 710,
                        "status": "perfect match",
                        "transcript_name": "Bijan Robinson"
                    }
                ]
            },
            "Blake Ferguson": {
                "mentioned_sentence_indexes": [
                    670
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Blake Ferguson",
                        "original sentence": "I think there's a chance for him to be Ferguson.",
                        "player_id": "3843470",
                        "score": 100,
                        "sentence": "I think there's a chance for him to be Blake Ferguson.",
                        "sentence_index": 670,
                        "status": "best of multiple matches",
                        "transcript_name": "Ferguson"
                    }
                ]
            },
            "Bralon Addison": {
                "mentioned_sentence_indexes": [
                    397,
                    398
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Bralon Addison",
                        "original sentence": "Um, listen, I I do think obviously especially with what's his name um being Addison.",
                        "player_id": "2971271",
                        "score": 100,
                        "sentence": "Um, listen, I I do think obviously especially with what's his name um being Bralon Addison.",
                        "sentence_index": 397,
                        "status": "best of multiple matches",
                        "transcript_name": "Addison"
                    },
                    {
                        "matched_name": "Bralon Addison",
                        "original sentence": "Addison being uh gone suspended for a couple games.",
                        "player_id": "2971271",
                        "score": 100,
                        "sentence": "Bralon Addison being uh gone suspended for a couple games.",
                        "sentence_index": 398,
                        "status": "best of multiple matches",
                        "transcript_name": "Addison"
                    }
                ]
            },
            "Briley Moore": {
                "mentioned_sentence_indexes": [
                    852
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Briley Moore",
                        "original sentence": "DJ Moore, uh, Romo Dunay, the the staff has been raving about Luther Burton over the last two weeks.",
                        "player_id": "4030915",
                        "score": 100,
                        "sentence": "DJ Briley Moore, uh, Romo Dunay, the the staff has been raving about Luther Burton over the last two weeks.",
                        "sentence_index": 852,
                        "status": "best of multiple matches",
                        "transcript_name": "Moore"
                    }
                ]
            },
            "Brock Bowers": {
                "mentioned_sentence_indexes": [
                    98,
                    108,
                    110,
                    79,
                    846,
                    81,
                    178,
                    84,
                    86
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Brock Bowers",
                        "original sentence": "Like, dude, Brock Bowers is again all the targets.",
                        "player_id": "4432665",
                        "score": 100,
                        "sentence": "Like, dude, Brock Bowers is again all the targets.",
                        "sentence_index": 79,
                        "status": "perfect match",
                        "transcript_name": "Brock Bowers"
                    },
                    {
                        "matched_name": "Brock Bowers",
                        "original sentence": "So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one.",
                        "player_id": "4432665",
                        "score": 100,
                        "sentence": "So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one.",
                        "sentence_index": 81,
                        "status": "perfect match",
                        "transcript_name": "Brock Bowers"
                    },
                    {
                        "matched_name": "Brock Bowers",
                        "original sentence": "So Brock Bowers one, George Kittle two, Trey Trey McBride three.",
                        "player_id": "4432665",
                        "score": 100,
                        "sentence": "So Brock Bowers one, George Kittle two, Trey Trey McBride three.",
                        "sentence_index": 84,
                        "status": "perfect match",
                        "transcript_name": "Brock Bowers"
                    },
                    {
                        "matched_name": "Brock Bowers",
                        "original sentence": "I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish.",
                        "player_id": "4432665",
                        "score": 100,
                        "sentence": "I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish.",
                        "sentence_index": 86,
                        "status": "perfect match",
                        "transcript_name": "Brock Bowers"
                    },
                    {
                        "matched_name": "Brock Bowers",
                        "original sentence": "Brock Bowers goes off the board at 17.",
                        "player_id": "4432665",
                        "score": 100,
                        "sentence": "Brock Bowers goes off the board at 17.",
                        "sentence_index": 98,
                        "status": "perfect match",
                        "transcript_name": "Brock Bowers"
                    },
                    {
                        "matched_name": "Brock Bowers",
                        "original sentence": "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go.",
                        "player_id": "4432665",
                        "score": 100,
                        "sentence": "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock Bowers I wait for Brock Bowers Bowers to go.",
                        "sentence_index": 108,
                        "status": "best of multiple matches",
                        "transcript_name": "Brock"
                    },
                    {
                        "matched_name": "Brock Bowers",
                        "original sentence": "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go.",
                        "player_id": "4432665",
                        "score": 100,
                        "sentence": "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go.",
                        "sentence_index": 108,
                        "status": "perfect match",
                        "transcript_name": "Brock Bowers"
                    },
                    {
                        "matched_name": "Brock Bowers",
                        "original sentence": "instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle.",
                        "player_id": "4432665",
                        "score": 100,
                        "sentence": "instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle.",
                        "sentence_index": 110,
                        "status": "perfect match",
                        "transcript_name": "Brock Bowers"
                    },
                    {
                        "matched_name": "Brock Bowers",
                        "original sentence": "Obviously, uh you have Brock Bowers is number one target.",
                        "player_id": "4432665",
                        "score": 100,
                        "sentence": "Obviously, uh you have Brock Bowers is number one target.",
                        "sentence_index": 178,
                        "status": "perfect match",
                        "transcript_name": "Brock Bowers"
                    },
                    {
                        "matched_name": "Brock Bowers",
                        "original sentence": "And I think I forgot I had to move I have to I have to go back in and move Brock Bowers down because when I don't it automatically moves him to my number one overall player.",
                        "player_id": "4432665",
                        "score": 100,
                        "sentence": "And I think I forgot I had to move I have to I have to go back in and move Brock Bowers down because when I don't it automatically moves him to my number one overall player.",
                        "sentence_index": 846,
                        "status": "perfect match",
                        "transcript_name": "Brock Bowers"
                    }
                ]
            },
            "Caleb Benenoch": {
                "mentioned_sentence_indexes": [
                    867
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Caleb Benenoch",
                        "original sentence": "um when they got they got the ball in Kosen Levenson's hand on a quick easy pass right away and then another one you know a few plays later right down the seam and you know how do you make things easy on your quarterback is is give him predetermined quick easy reads that he can you know hit that back foot and and let it rip and Caleb we talked about it Caleb Williams actually looked good doing that we weren't sure if he was able to if he was going to be able to play within the confines of like a structured offense like that and he looked good doing it.",
                        "player_id": "3047575",
                        "score": 100,
                        "sentence": "um when they got they got the ball in Kosen Levenson's hand on a quick easy pass right away and then another one you know a few plays later right down the seam and you know how do you make things easy on your quarterback is is give him predetermined quick easy reads that he can you know hit that back foot and and let it rip and Caleb Benenoch we talked about it Caleb Benenoch Williams actually looked good doing that we weren't sure if he was able to if he was going to be able to play within the confines of like a structured offense like that and he looked good doing it.",
                        "sentence_index": 867,
                        "status": "best of multiple matches",
                        "transcript_name": "Caleb"
                    }
                ]
            },
            "Caleb Johnson": {
                "mentioned_sentence_indexes": [
                    497,
                    499
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Caleb Johnson",
                        "original sentence": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson.",
                        "player_id": "4569383",
                        "score": 100,
                        "sentence": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson.",
                        "sentence_index": 497,
                        "status": "perfect match",
                        "transcript_name": "Caleb Johnson"
                    },
                    {
                        "matched_name": "Caleb Johnson",
                        "original sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
                        "player_id": "4569383",
                        "score": 100,
                        "sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
                        "sentence_index": 499,
                        "status": "perfect match",
                        "transcript_name": "Caleb Johnson"
                    }
                ]
            },
            "Caleb Williams": {
                "mentioned_sentence_indexes": [
                    867
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Caleb Williams",
                        "original sentence": "um when they got they got the ball in Kosen Levenson's hand on a quick easy pass right away and then another one you know a few plays later right down the seam and you know how do you make things easy on your quarterback is is give him predetermined quick easy reads that he can you know hit that back foot and and let it rip and Caleb we talked about it Caleb Williams actually looked good doing that we weren't sure if he was able to if he was going to be able to play within the confines of like a structured offense like that and he looked good doing it.",
                        "player_id": "4431611",
                        "score": 100,
                        "sentence": "um when they got they got the ball in Kosen Levenson's hand on a quick easy pass right away and then another one you know a few plays later right down the seam and you know how do you make things easy on your quarterback is is give him predetermined quick easy reads that he can you know hit that back foot and and let it rip and Caleb we talked about it Caleb Williams actually looked good doing that we weren't sure if he was able to if he was going to be able to play within the confines of like a structured offense like that and he looked good doing it.",
                        "sentence_index": 867,
                        "status": "perfect match",
                        "transcript_name": "Caleb Williams"
                    }
                ]
            },
            "Colston Loveland": {
                "mentioned_sentence_indexes": [
                    835,
                    871,
                    872,
                    873,
                    876,
                    591,
                    594,
                    499,
                    853,
                    829
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Colston Loveland",
                        "original sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
                        "player_id": "4723086",
                        "score": 86,
                        "sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Loveland, another tight end, a Jackson Dart.",
                        "sentence_index": 499,
                        "status": "perfect match",
                        "transcript_name": "Colston Love"
                    },
                    {
                        "matched_name": "Colston Loveland",
                        "original sentence": "All right 6 through 12 I went uh Travis Kelce Sam Sam LePorta at seven at eight I went Colston Loveland.",
                        "player_id": "4723086",
                        "score": 100,
                        "sentence": "All right 6 through 12 I went uh Travis Kelce Sam Sam LePorta at seven at eight I went Colston Loveland.",
                        "sentence_index": 591,
                        "status": "perfect match",
                        "transcript_name": "Colston Loveland"
                    },
                    {
                        "matched_name": "Colston Loveland",
                        "original sentence": "We were talking ADP wise like who's the highest on Loveland?",
                        "player_id": "4723086",
                        "score": 100,
                        "sentence": "We were talking ADP wise like who's the highest on Colston Loveland?",
                        "sentence_index": 594,
                        "status": "perfect match",
                        "transcript_name": "Loveland"
                    },
                    {
                        "matched_name": "Colston Loveland",
                        "original sentence": "So, Matt, you have Coloulston Lovelin in at number nine.",
                        "player_id": "4723086",
                        "score": 82,
                        "sentence": "So, Matt, you have Colston Loveland in at number nine.",
                        "sentence_index": 829,
                        "status": "perfect match",
                        "transcript_name": "Coloulston Lovelin"
                    },
                    {
                        "matched_name": "Colston Loveland",
                        "original sentence": "He's like, \"Whoa, Matt's got Coloulston Lovelin so high.",
                        "player_id": "4723086",
                        "score": 82,
                        "sentence": "He's like, \"Whoa, Matt's got Colston Loveland so high.",
                        "sentence_index": 835,
                        "status": "perfect match",
                        "transcript_name": "Coloulston Lovelin"
                    },
                    {
                        "matched_name": "Colston Loveland",
                        "original sentence": "So, how does how does Colston Lovelin carve out a path in a 2025 season as a rookie tight end?",
                        "player_id": "4723086",
                        "score": 90,
                        "sentence": "So, how does how does Colston Loveland carve out a path in a 2025 season as a rookie tight end?",
                        "sentence_index": 853,
                        "status": "perfect match",
                        "transcript_name": "Colston Lovelin"
                    },
                    {
                        "matched_name": "Colston Loveland",
                        "original sentence": "And I think that's kind of gonna kind of snowball into Coulson Lovelin getting a lot of targets and then getting a lot of confidence.",
                        "player_id": "4723086",
                        "score": 84,
                        "sentence": "And I think that's kind of gonna kind of snowball into Colston Loveland getting a lot of targets and then getting a lot of confidence.",
                        "sentence_index": 871,
                        "status": "perfect match",
                        "transcript_name": "Coulson Lovelin"
                    },
                    {
                        "matched_name": "Colston Loveland",
                        "original sentence": "And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Coulson Lovelin is very good at.",
                        "player_id": "4723086",
                        "score": 84,
                        "sentence": "And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Colston Loveland is very good at.",
                        "sentence_index": 872,
                        "status": "perfect match",
                        "transcript_name": "Coulson Lovelin"
                    },
                    {
                        "matched_name": "Colston Loveland",
                        "original sentence": "I think I think it's going to be kind of a glove inhand fit with with Coulson Lovelin, the young quarterback, and this offense.",
                        "player_id": "4723086",
                        "score": 84,
                        "sentence": "I think I think it's going to be kind of a glove inhand fit with with Colston Loveland, the young quarterback, and this offense.",
                        "sentence_index": 873,
                        "status": "perfect match",
                        "transcript_name": "Coulson Lovelin"
                    },
                    {
                        "matched_name": "Colston Loveland",
                        "original sentence": "We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career.",
                        "player_id": "4723086",
                        "score": 87,
                        "sentence": "We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Colston Loveland had a better long-term career.",
                        "sentence_index": 876,
                        "status": "perfect match",
                        "transcript_name": "Coulson Leland"
                    }
                ]
            },
            "Courtland Sutton": {
                "mentioned_sentence_indexes": [
                    259
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Courtland Sutton",
                        "original sentence": "We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun.",
                        "player_id": "3128429",
                        "score": 90,
                        "sentence": "We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sutton.",
                        "sentence_index": 259,
                        "status": "perfect match",
                        "transcript_name": "Courtland Sun"
                    }
                ]
            },
            "DJ Johnson": {
                "mentioned_sentence_indexes": [
                    857
                ],
                "occurrence_array": [
                    {
                        "matched_name": "DJ Johnson",
                        "original sentence": "Um, so that's going to be I think the biggest hurdle is to to get over is is to get the targets, but we've seen obviously rookies make a big impact in Ben Johnson's offense in the past.",
                        "player_id": "4240623",
                        "score": 82,
                        "sentence": "Um, so that's going to be I think the biggest hurdle is to to get over is is to get the targets, but we've seen obviously rookies make a big impact in DJ Johnson offense in the past.",
                        "sentence_index": 857,
                        "status": "best of multiple matches",
                        "transcript_name": "Ben Johnson's"
                    }
                ]
            },
            "Dalton Kincaid": {
                "mentioned_sentence_indexes": [
                    680,
                    625,
                    675,
                    681
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Dalton Kincaid",
                        "original sentence": "And I have Dalton Kincaid at 12.",
                        "player_id": "4385690",
                        "score": 100,
                        "sentence": "And I have Dalton Kincaid at 12.",
                        "sentence_index": 625,
                        "status": "perfect match",
                        "transcript_name": "Dalton Kincaid"
                    },
                    {
                        "matched_name": "Dalton Kincaid",
                        "original sentence": "I settle Dalton Kincaid.",
                        "player_id": "4385690",
                        "score": 100,
                        "sentence": "I settle Dalton Kincaid.",
                        "sentence_index": 675,
                        "status": "perfect match",
                        "transcript_name": "Dalton Kincaid"
                    },
                    {
                        "matched_name": "Dalton Kincaid",
                        "original sentence": "So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid?",
                        "player_id": "4385690",
                        "score": 100,
                        "sentence": "So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid?",
                        "sentence_index": 680,
                        "status": "perfect match",
                        "transcript_name": "Dalton Kincaid"
                    },
                    {
                        "matched_name": "Dalton Kincaid",
                        "original sentence": "I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around.",
                        "player_id": "4385690",
                        "score": 100,
                        "sentence": "I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around.",
                        "sentence_index": 681,
                        "status": "perfect match",
                        "transcript_name": "Dalton Kincaid"
                    }
                ]
            },
            "Daniel Jones": {
                "mentioned_sentence_indexes": [
                    883
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Daniel Jones",
                        "original sentence": "Help Daniel Jones out on his roll out who's the athletic tight end.",
                        "player_id": "3917792",
                        "score": 100,
                        "sentence": "Help Daniel Jones out on his roll out who's the athletic tight end.",
                        "sentence_index": 883,
                        "status": "perfect match",
                        "transcript_name": "Daniel Jones"
                    }
                ]
            },
            "David Agoha": {
                "mentioned_sentence_indexes": [
                    132,
                    260,
                    137,
                    202,
                    206,
                    496,
                    241,
                    497,
                    147,
                    498,
                    499
                ],
                "occurrence_array": [
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "This is the guy who I believe it is and it's my tight end four, David and David Njoku.",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "This is the guy who I believe it is and it's my tight end four, David Agoha and David Agoha Njoku.",
                        "sentence_index": 132,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    },
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David and David Njoku was my guy for that.",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David Agoha and David Agoha Njoku was my guy for that.",
                        "sentence_index": 137,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    },
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "But the the guy to own for me in this offense, if I have to pick one, is absolutely David 100%.",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "But the the guy to own for me in this offense, if I have to pick one, is absolutely David Agoha 100%.",
                        "sentence_index": 147,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    },
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "I don't think it's at the expense of David and David Njoku.",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "I don't think it's at the expense of David Agoha and David Agoha Njoku.",
                        "sentence_index": 202,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    },
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "So, I have David and David Njoku at four.",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "So, I have David Agoha and David Agoha Njoku at four.",
                        "sentence_index": 206,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    },
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven.",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "David Agoha and David Agoha Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven.",
                        "sentence_index": 241,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    },
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram.",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David Agoha and David Agoha Njoku over Evan Engram.",
                        "sentence_index": 260,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    },
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "Because you could probably get David and David Njoku plus a first uh this year.\"",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "Because you could probably get David Agoha and David Agoha Njoku plus a first uh this year.\"",
                        "sentence_index": 496,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    },
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson.",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "And just imagine if you got you sold David Agoha Sam LePorta for David Agoha and David Agoha Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson.",
                        "sentence_index": 497,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    },
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "Sam Sam or I'm sorry um David and David Njoku.",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "Sam Sam or I'm sorry um David Agoha and David Agoha Njoku.",
                        "sentence_index": 498,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    },
                    {
                        "matched_name": "David Agoha",
                        "original sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
                        "player_id": "5144941",
                        "score": 100,
                        "sentence": "Yeah, David Agoha and David Agoha Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
                        "sentence_index": 499,
                        "status": "best of multiple matches",
                        "transcript_name": "David"
                    }
                ]
            },
            "David Njoku": {
                "mentioned_sentence_indexes": [
                    258,
                    132,
                    260,
                    137,
                    148,
                    152,
                    166,
                    294,
                    169,
                    172,
                    175,
                    181,
                    192,
                    449,
                    199,
                    202,
                    206,
                    467,
                    495,
                    496,
                    241,
                    497,
                    498,
                    499
                ],
                "occurrence_array": [
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "This is the guy who I believe it is and it's my tight end four, David and David Njoku.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "This is the guy who I believe it is and it's my tight end four, David and David Njoku.",
                        "sentence_index": 132,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David and David Njoku was my guy for that.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David and David Njoku was my guy for that.",
                        "sentence_index": 137,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "That's I'm a little bit lower on Jerry Jeudy than probably like I think than Rich because I think it's going to be the David Njoku show.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "That's I'm a little bit lower on Jerry Jeudy than probably like I think than Rich because I think it's going to be the David Njoku show.",
                        "sentence_index": 148,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "Um as far as uh Jerry Jeudy and and Joe Flacco, but I I think I think David Njoku and him have proven over time that you know obviously they have a really really strong connection.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "Um as far as uh Jerry Jeudy and and Joe Flacco, but I I think I think David Njoku and him have proven over time that you know obviously they have a really really strong connection.",
                        "sentence_index": 152,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "It's why I'm willing to gamble on the George Kittle because if I miss out I'm totally comfortable getting in David Njoku.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "It's why I'm willing to gamble on the George Kittle because if I miss out I'm totally comfortable getting in David Njoku.",
                        "sentence_index": 166,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "And I I like David Njoku.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "And I I like David Njoku.",
                        "sentence_index": 169,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "If something happens, they lose a few games, they're going to start turning to these rookies and then who the hell knows what we got out of a guy like David Njoku.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "If something happens, they lose a few games, they're going to start turning to these rookies and then who the hell knows what we got out of a guy like David Njoku.",
                        "sentence_index": 172,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "And I I still think David Njoku fits the mold of what we're looking for for the guys that have the chance to break in here.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "And I I still think David Njoku fits the mold of what we're looking for for the guys that have the chance to break in here.",
                        "sentence_index": 175,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "I think the same thing in David Njoku falls into the same line as if he's not 1A, he is 1B.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "I think the same thing in David Njoku falls into the same line as if he's not 1A, he is 1B.",
                        "sentence_index": 181,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Jok.",
                        "player_id": "3123076",
                        "score": 90,
                        "sentence": "I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Njoku.",
                        "sentence_index": 192,
                        "status": "perfect match",
                        "transcript_name": "David Jok"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "Harold Fannon looked good in this past few seasons and and with David Njoku coming into a contract year, is there any thought that he chips away and and starts kind of getting a bigger piece of that pie?",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "Harold Fannon looked good in this past few seasons and and with David Njoku coming into a contract year, is there any thought that he chips away and and starts kind of getting a bigger piece of that pie?",
                        "sentence_index": 199,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "I don't think it's at the expense of David and David Njoku.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "I don't think it's at the expense of David and David Njoku.",
                        "sentence_index": 202,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "So, I have David and David Njoku at four.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "So, I have David and David Njoku at four.",
                        "sentence_index": 206,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven.",
                        "sentence_index": 241,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "I I couldn't get ahead of David Njoku because David Njoku's to me is a little bit more clear-cut.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "I I couldn't get ahead of David Njoku because David Njoku's to me is a little bit more clear-cut.",
                        "sentence_index": 258,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "I I couldn't get ahead of David Njoku because David Njoku's to me is a little bit more clear-cut.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "I I couldn't get ahead of David Njoku because David Njoku's to me is a little bit more clear-cut.",
                        "sentence_index": 258,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram.",
                        "sentence_index": 260,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "Um, you have him, you have him and David Njoku flip-flopped, right?",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "Um, you have him, you have him and David Njoku flip-flopped, right?",
                        "sentence_index": 294,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high but like I said when I get to tight end 678 so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high but like I said when I get to tight end 678 so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you.",
                        "sentence_index": 449,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is 82",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is 82",
                        "sentence_index": 467,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right?",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "So like my suggestion was like, \"Hey, move off of Sam LePorta for like even like a guy like in David Njoku extender plus, right?",
                        "sentence_index": 495,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "Because you could probably get David and David Njoku plus a first uh this year.\"",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "Because you could probably get David and David Njoku plus a first uh this year.\"",
                        "sentence_index": 496,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson.",
                        "sentence_index": 497,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "Sam Sam or I'm sorry um David and David Njoku.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "Sam Sam or I'm sorry um David and David Njoku.",
                        "sentence_index": 498,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    },
                    {
                        "matched_name": "David Njoku",
                        "original sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
                        "player_id": "3123076",
                        "score": 100,
                        "sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
                        "sentence_index": 499,
                        "status": "perfect match",
                        "transcript_name": "David Njoku"
                    }
                ]
            },
            "DeVonta Smith": {
                "mentioned_sentence_indexes": [
                    503
                ],
                "occurrence_array": [
                    {
                        "matched_name": "DeVonta Smith",
                        "original sentence": "I feel like Dvonte Smith, like I said last year, like I love Devonte Smith.",
                        "player_id": "4241478",
                        "score": 88,
                        "sentence": "I feel like DeVonta Smith, like I said last year, like I love Devonte Smith.",
                        "sentence_index": 503,
                        "status": "perfect match",
                        "transcript_name": "Dvonte Smith"
                    },
                    {
                        "matched_name": "DeVonta Smith",
                        "original sentence": "I feel like Dvonte Smith, like I said last year, like I love Devonte Smith.",
                        "player_id": "4241478",
                        "score": 92,
                        "sentence": "I feel like Dvonte Smith, like I said last year, like I love DeVonta Smith.",
                        "sentence_index": 503,
                        "status": "perfect match",
                        "transcript_name": "Devonte Smith"
                    }
                ]
            },
            "DeWayne McBride": {
                "mentioned_sentence_indexes": [
                    89
                ],
                "occurrence_array": [
                    {
                        "matched_name": "DeWayne McBride",
                        "original sentence": "I ended up going Brock Bowers George Kittle Trey McBride is on the same page.",
                        "player_id": "4430388",
                        "score": 82,
                        "sentence": "I ended up going Brock Bowers George Kittle Trey McBride is on the same page.",
                        "sentence_index": 89,
                        "status": "best of multiple matches",
                        "transcript_name": "KD McBride"
                    }
                ]
            },
            "Deebo Samuel": {
                "mentioned_sentence_indexes": [
                    614
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Deebo Samuel",
                        "original sentence": "If it wasn't for Debo Samuel, Zach Ertz would have been higher.",
                        "player_id": "3126486",
                        "score": 96,
                        "sentence": "If it wasn't for Deebo Samuel, Zach Ertz would have been higher.",
                        "sentence_index": 614,
                        "status": "perfect match",
                        "transcript_name": "Debo Samuel"
                    }
                ]
            },
            "Deshaun Watson": {
                "mentioned_sentence_indexes": [
                    153
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Deshaun Watson",
                        "original sentence": "And even any quarterback not named Deshun Watson to start and finish a game last year, he averaged over 15 points a game.",
                        "player_id": "3122840",
                        "score": 96,
                        "sentence": "And even any quarterback not named Deshaun Watson to start and finish a game last year, he averaged over 15 points a game.",
                        "sentence_index": 153,
                        "status": "perfect match",
                        "transcript_name": "Deshun Watson"
                    }
                ]
            },
            "Dillon Gabriel": {
                "mentioned_sentence_indexes": [
                    197,
                    174,
                    279,
                    281,
                    190
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Dillon Gabriel",
                        "original sentence": "I think Dillon Gabriel's a better quarterback than all those guys.",
                        "player_id": "4427238",
                        "score": 100,
                        "sentence": "I think Dillon Gabriel's a better quarterback than all those guys.",
                        "sentence_index": 174,
                        "status": "perfect match",
                        "transcript_name": "Dillon Gabriel"
                    },
                    {
                        "matched_name": "Dillon Gabriel",
                        "original sentence": "Uh um a Dillon Gabriel obviously kind of earned the backup role there after this last performance um in everyone's eyes here.",
                        "player_id": "4427238",
                        "score": 100,
                        "sentence": "Uh um a Dillon Gabriel obviously kind of earned the backup role there after this last performance um in everyone's eyes here.",
                        "sentence_index": 190,
                        "status": "perfect match",
                        "transcript_name": "Dillon Gabriel"
                    },
                    {
                        "matched_name": "Dillon Gabriel",
                        "original sentence": "I think if you bring in a guy like Dillon Gabriel, they're going to try and keep things short and sweet for him to start, right?",
                        "player_id": "4427238",
                        "score": 100,
                        "sentence": "I think if you bring in a guy like Dillon Gabriel, they're going to try and keep things short and sweet for him to start, right?",
                        "sentence_index": 197,
                        "status": "perfect match",
                        "transcript_name": "Dillon Gabriel"
                    },
                    {
                        "matched_name": "Dillon Gabriel",
                        "original sentence": "I think they're going to want to see what they have in Dillon Gabriel because like if they they spend a third round pick on him.",
                        "player_id": "4427238",
                        "score": 100,
                        "sentence": "I think they're going to want to see what they have in Dillon Gabriel because like if they they spend a third round pick on him.",
                        "sentence_index": 279,
                        "status": "perfect match",
                        "transcript_name": "Dillon Gabriel"
                    },
                    {
                        "matched_name": "Dillon Gabriel",
                        "original sentence": "Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback.",
                        "player_id": "4427238",
                        "score": 100,
                        "sentence": "Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback.",
                        "sentence_index": 281,
                        "status": "perfect match",
                        "transcript_name": "Dillon Gabriel"
                    },
                    {
                        "matched_name": "Dillon Gabriel",
                        "original sentence": "Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback.",
                        "player_id": "4427238",
                        "score": 100,
                        "sentence": "Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback.",
                        "sentence_index": 281,
                        "status": "perfect match",
                        "transcript_name": "Dillon Gabriel"
                    },
                    {
                        "matched_name": "Dillon Gabriel",
                        "original sentence": "Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback.",
                        "player_id": "4427238",
                        "score": 100,
                        "sentence": "Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback.",
                        "sentence_index": 281,
                        "status": "perfect match",
                        "transcript_name": "Dillon Gabriel"
                    }
                ]
            },
            "Dorian Thompson-Robinson": {
                "mentioned_sentence_indexes": [
                    157
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Dorian Thompson-Robinson",
                        "original sentence": "Thompson Robinson, Dorian Thompson Robinson, the worst quarterback I've ever seen play in.",
                        "player_id": "4367178",
                        "score": 100,
                        "sentence": "Dorian Thompson-Robinson, Dorian Dorian Thompson-Robinson, the worst quarterback I've ever seen play in.",
                        "sentence_index": 157,
                        "status": "perfect match",
                        "transcript_name": "Thompson Robinson"
                    },
                    {
                        "matched_name": "Dorian Thompson-Robinson",
                        "original sentence": "Thompson Robinson, Dorian Thompson Robinson, the worst quarterback I've ever seen play in.",
                        "player_id": "4367178",
                        "score": 100,
                        "sentence": "Thompson Robinson, Dorian Thompson-Robinson, the worst quarterback I've ever seen play in.",
                        "sentence_index": 157,
                        "status": "perfect match",
                        "transcript_name": "Dorian Thompson Robinson"
                    }
                ]
            },
            "Drake London": {
                "mentioned_sentence_indexes": [
                    708
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Drake London",
                        "original sentence": "I mean, it is it's Drake London to be Well, right.",
                        "player_id": "4426502",
                        "score": 100,
                        "sentence": "I mean, it is it's Drake London to be Well, right.",
                        "sentence_index": 708,
                        "status": "perfect match",
                        "transcript_name": "Drake London"
                    }
                ]
            },
            "Evan Engram": {
                "mentioned_sentence_indexes": [
                    225,
                    259,
                    260,
                    293,
                    453,
                    584,
                    779,
                    237,
                    242,
                    211,
                    244,
                    467,
                    759,
                    923,
                    380,
                    381
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "Evan Engram.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "Evan Engram.",
                        "sentence_index": 211,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "I don't know that it's going to be as the Evan Engram yet.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "I don't know that it's going to be as the Evan Engram yet.",
                        "sentence_index": 225,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "So Evan Engram is left, you know, as the guy that they're going to kind of use as this moving chest piece.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "So Evan Engram is left, you know, as the guy that they're going to kind of use as this moving chest piece.",
                        "sentence_index": 237,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "So, I mean I mean I don't have I can't find Evan Engram right here, but we're like one year removed from him being bananas and I could",
                        "sentence_index": 242,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there and I'm agree with you.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "that's why that's why I was gonna go off of Matt like so when you look at tight Evan Engram what he can do when the target shares there and I'm agree with you.",
                        "sentence_index": 244,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "We want to see Evan Engram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun.",
                        "sentence_index": 259,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram.",
                        "sentence_index": 260,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "Um Evan Engram, I have him at five.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "Um Evan Engram, I have him at five.",
                        "sentence_index": 293,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "So you have I think my Evan Engram was or no?",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "So you have I think my Evan Engram was or no?",
                        "sentence_index": 380,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "Oh yeah, Evan Engram four Jou five and then Travis G.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "Oh yeah, Evan Engram four Jou five and then Travis G.",
                        "sentence_index": 381,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "I like I almost want to put Evan Engram in his own tier because I'm with you Matt like how I believe he's going to play that Evan Engram role.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "I like I almost want to put Evan Engram in his own tier because I'm with you Matt like how I believe he's going to play that Evan Engram role.",
                        "sentence_index": 453,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "I like I almost want to put Evan Engram in his own tier because I'm with you Matt like how I believe he's going to play that Evan Engram role.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "I like I almost want to put Evan Engram in his own tier because I'm with you Matt like how I believe he's going to play that Evan Engram role.",
                        "sentence_index": 453,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is 82",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "when you get into a lot of the guys that we're talking about Evan Engram David and David Njoku Tucker Tucker Kraft Evan Engram's 80 and David Njoku is 82",
                        "sentence_index": 467,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine.",
                        "sentence_index": 584,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "Evan Engram came out, same gang busters.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "Evan Engram came out, same gang busters.",
                        "sentence_index": 759,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "I would rather just gamble on the upside and like and then hope that like he doesn't work out in like Atlanta and he goes somewhere else and like just like Evan Engram it was great, right?",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "I would rather just gamble on the upside and like and then hope that like he doesn't work out in like Atlanta and he goes somewhere else and like just like Evan Engram it was great, right?",
                        "sentence_index": 779,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    },
                    {
                        "matched_name": "Evan Engram",
                        "original sentence": "Evan Engram's a little bit older.",
                        "player_id": "3051876",
                        "score": 100,
                        "sentence": "Evan Engram's a little bit older.",
                        "sentence_index": 923,
                        "status": "perfect match",
                        "transcript_name": "Evan Engram"
                    }
                ]
            },
            "Garrett Wilson": {
                "mentioned_sentence_indexes": [
                    895
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Garrett Wilson",
                        "original sentence": "Nobody there to catch the football outside of Garrett Wilson.",
                        "player_id": "4569618",
                        "score": 100,
                        "sentence": "Nobody there to catch the football outside of Garrett Wilson.",
                        "sentence_index": 895,
                        "status": "perfect match",
                        "transcript_name": "Garrett Wilson"
                    }
                ]
            },
            "George Kittle": {
                "mentioned_sentence_indexes": [
                    129,
                    486,
                    103,
                    487,
                    77,
                    109,
                    110,
                    81,
                    241,
                    84,
                    180,
                    86,
                    599,
                    922
                ],
                "occurrence_array": [
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "I really wanted to put George Kittle as my tight end.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "I really wanted to put George Kittle as my tight end.",
                        "sentence_index": 77,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one.",
                        "sentence_index": 81,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "So Brock Bowers one, George Kittle two, Trey Trey McBride three.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "So Brock Bowers one, George Kittle two, Trey Trey McBride three.",
                        "sentence_index": 84,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish.",
                        "sentence_index": 86,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "10 picks later, George Kittle 38.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "10 picks later, George Kittle 38.",
                        "sentence_index": 103,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is.",
                        "sentence_index": 109,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle.",
                        "sentence_index": 110,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "So, like if I miss out on George Kittle to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam LePorta is going to usually go tight end four there.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "So, like if I miss out on George Kittle to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam LePorta is going to usually go tight end four there.",
                        "sentence_index": 129,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "George Kittle, if he's not number one, he's 1B, right?",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "George Kittle, if he's not number one, he's 1B, right?",
                        "sentence_index": 180,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "David and David Njoku is kind of in his own tier after George Kittle and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven.",
                        "sentence_index": 241,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "What did we used to talk about with George Kittle?",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "What did we used to talk about with George Kittle?",
                        "sentence_index": 486,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta.",
                        "sentence_index": 487,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "Now, now we see why George Kittle is below him in our in our GM tool.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "Now, now we see why George Kittle is below him in our in our GM tool.",
                        "sentence_index": 599,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    },
                    {
                        "matched_name": "George Kittle",
                        "original sentence": "And and you know, given, you know, that some of these guys, you know, George Kittle's a little bit older.",
                        "player_id": "3040151",
                        "score": 100,
                        "sentence": "And and you know, given, you know, that some of these guys, you know, George Kittle's a little bit older.",
                        "sentence_index": 922,
                        "status": "perfect match",
                        "transcript_name": "George Kittle"
                    }
                ]
            },
            "Harold Fannin Jr.": {
                "mentioned_sentence_indexes": [
                    199
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Harold Fannin Jr.",
                        "original sentence": "Harold Fannon looked good in this past few seasons and and with David Njoku coming into a contract year, is there any thought that he chips away and and starts kind of getting a bigger piece of that pie?",
                        "player_id": "5083076",
                        "score": 83,
                        "sentence": "Harold Fannin Jr. looked good in this past few seasons and and with David Njoku coming into a contract year, is there any thought that he chips away and and starts kind of getting a bigger piece of that pie?",
                        "sentence_index": 199,
                        "status": "perfect match",
                        "transcript_name": "Harold Fannon"
                    }
                ]
            },
            "Henry Anderson": {
                "mentioned_sentence_indexes": [
                    665
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Henry Anderson",
                        "original sentence": "You know, if not a third, a third and fourth would get done for Henry.",
                        "player_id": "2517752",
                        "score": 100,
                        "sentence": "You know, if not a third, a third and fourth would get done for Henry Anderson.",
                        "sentence_index": 665,
                        "status": "best of multiple matches",
                        "transcript_name": "Henry"
                    }
                ]
            },
            "Hunter Henry": {
                "mentioned_sentence_indexes": [
                    673,
                    647,
                    648,
                    586,
                    588,
                    748,
                    658,
                    661,
                    767
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Hunter Henry",
                        "original sentence": "At 11 I have Hunter Henry.",
                        "player_id": "3046439",
                        "score": 100,
                        "sentence": "At 11 I have Hunter Henry.",
                        "sentence_index": 586,
                        "status": "perfect match",
                        "transcript_name": "Hunter Henry"
                    },
                    {
                        "matched_name": "Hunter Henry",
                        "original sentence": "I thought about getting Hunter Henry in there.",
                        "player_id": "3046439",
                        "score": 100,
                        "sentence": "I thought about getting Hunter Henry in there.",
                        "sentence_index": 588,
                        "status": "perfect match",
                        "transcript_name": "Hunter Henry"
                    },
                    {
                        "matched_name": "Hunter Henry",
                        "original sentence": "My weird one was uh Hunter Henry.",
                        "player_id": "3046439",
                        "score": 100,
                        "sentence": "My weird one was uh Hunter Henry.",
                        "sentence_index": 647,
                        "status": "perfect match",
                        "transcript_name": "Hunter Henry"
                    },
                    {
                        "matched_name": "Hunter Henry",
                        "original sentence": "Hunter Henry.",
                        "player_id": "3046439",
                        "score": 100,
                        "sentence": "Hunter Henry.",
                        "sentence_index": 648,
                        "status": "perfect match",
                        "transcript_name": "Hunter Henry"
                    },
                    {
                        "matched_name": "Hunter Henry",
                        "original sentence": "and and Hunter Henry even missed the game.",
                        "player_id": "3046439",
                        "score": 100,
                        "sentence": "and and Hunter Henry even missed the game.",
                        "sentence_index": 658,
                        "status": "perfect match",
                        "transcript_name": "Hunter Henry"
                    },
                    {
                        "matched_name": "Hunter Henry",
                        "original sentence": "97 targets last year for Hunter Henry.",
                        "player_id": "3046439",
                        "score": 100,
                        "sentence": "97 targets last year for Hunter Henry.",
                        "sentence_index": 661,
                        "status": "perfect match",
                        "transcript_name": "Hunter Henry"
                    },
                    {
                        "matched_name": "Hunter Henry",
                        "original sentence": "Hunter Henry, I was like, dude, a very clear path for him to be the number two target there.",
                        "player_id": "3046439",
                        "score": 100,
                        "sentence": "Hunter Henry, I was like, dude, a very clear path for him to be the number two target there.",
                        "sentence_index": 673,
                        "status": "perfect match",
                        "transcript_name": "Hunter Henry"
                    },
                    {
                        "matched_name": "Hunter Henry",
                        "original sentence": "There's so many all the like when we talk about all those bunch of guys in the bottom there like a guy in Zachary, it's Hunter Henry.",
                        "player_id": "3046439",
                        "score": 100,
                        "sentence": "There's so many all the like when we talk about all those bunch of guys in the bottom there like a guy in Zachary, it's Hunter Henry.",
                        "sentence_index": 748,
                        "status": "perfect match",
                        "transcript_name": "Hunter Henry"
                    },
                    {
                        "matched_name": "Hunter Henry",
                        "original sentence": "And it's the thing what Kyle Pitts cost you compared to what you give Hunter Henry for.",
                        "player_id": "3046439",
                        "score": 100,
                        "sentence": "And it's the thing what Kyle Pitts cost you compared to what you give Hunter Henry for.",
                        "sentence_index": 767,
                        "status": "perfect match",
                        "transcript_name": "Hunter Henry"
                    }
                ]
            },
            "Isaac TeSlaa": {
                "mentioned_sentence_indexes": [
                    500
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Isaac TeSlaa",
                        "original sentence": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent.",
                        "player_id": "5123663",
                        "score": 87,
                        "sentence": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac TeSlaa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent.",
                        "sentence_index": 500,
                        "status": "perfect match",
                        "transcript_name": "Isaac Tessa"
                    }
                ]
            },
            "J.J. McCarthy": {
                "mentioned_sentence_indexes": [
                    445,
                    391
                ],
                "occurrence_array": [
                    {
                        "matched_name": "J.J. McCarthy",
                        "original sentence": "Is it the nerves about JJ McCarthy first year or what what's what's causing that trepidation?",
                        "player_id": "4433970",
                        "score": 95,
                        "sentence": "Is it the nerves about J.J. McCarthy first year or what what's what's causing that trepidation?",
                        "sentence_index": 391,
                        "status": "best of multiple matches",
                        "transcript_name": "JJ McCarthy"
                    },
                    {
                        "matched_name": "J.J. McCarthy",
                        "original sentence": "Now that he's more than a full year removed from his injury, the fact that he's gonna be able to slide in as a number two target in this offense, um I think it'll kind of help propel him, build that rapport, JJ McCarthy, be again, we always talk about these rookie quarterbacks, like always one of their safety nets.",
                        "player_id": "4433970",
                        "score": 95,
                        "sentence": "Now that he's more than a full year removed from his injury, the fact that he's gonna be able to slide in as a number two target in this offense, um I think it'll kind of help propel him, build that rapport, J.J. McCarthy, be again, we always talk about these rookie quarterbacks, like always one of their safety nets.",
                        "sentence_index": 445,
                        "status": "best of multiple matches",
                        "transcript_name": "JJ McCarthy"
                    }
                ]
            },
            "J.K. Dobbins": {
                "mentioned_sentence_indexes": [
                    234,
                    230
                ],
                "occurrence_array": [
                    {
                        "matched_name": "J.K. Dobbins",
                        "original sentence": "JK Dobbins is reported he's the starter.",
                        "player_id": "4241985",
                        "score": 95,
                        "sentence": "J.K. Dobbins is reported he's the starter.",
                        "sentence_index": 230,
                        "status": "perfect match",
                        "transcript_name": "JK Dobbins"
                    },
                    {
                        "matched_name": "J.K. Dobbins",
                        "original sentence": "So, I mean, we all know that, you know, JK Dobbins is a talented guy.",
                        "player_id": "4241985",
                        "score": 95,
                        "sentence": "So, I mean, we all know that, you know, J.K. Dobbins is a talented guy.",
                        "sentence_index": 234,
                        "status": "perfect match",
                        "transcript_name": "JK Dobbins"
                    }
                ]
            },
            "Jake Ferguson": {
                "mentioned_sentence_indexes": [
                    672
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Jake Ferguson",
                        "original sentence": "Jake Ferguson has a chance like all those guys are all sitting there.",
                        "player_id": "4242355",
                        "score": 100,
                        "sentence": "Jake Ferguson has a chance like all those guys are all sitting there.",
                        "sentence_index": 672,
                        "status": "perfect match",
                        "transcript_name": "Jake Ferguson"
                    }
                ]
            },
            "Jameis Winston": {
                "mentioned_sentence_indexes": [
                    156
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Jameis Winston",
                        "original sentence": "Jameus Winston, uh, Thomas, uh, I even forget his name now.",
                        "player_id": "2969939",
                        "score": 93,
                        "sentence": "Jameis Winston, uh, Thomas, uh, I even forget his name now.",
                        "sentence_index": 156,
                        "status": "perfect match",
                        "transcript_name": "Jameus Winston"
                    }
                ]
            },
            "Jameson Williams": {
                "mentioned_sentence_indexes": [
                    472,
                    500,
                    492,
                    485
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Jameson Williams",
                        "original sentence": "And then if Jameson Williams is actually more involved and takes some of that away, like there's just a lot of little things.",
                        "player_id": "4426388",
                        "score": 100,
                        "sentence": "And then if Jameson Williams is actually more involved and takes some of that away, like there's just a lot of little things.",
                        "sentence_index": 472,
                        "status": "perfect match",
                        "transcript_name": "Jameson Williams"
                    },
                    {
                        "matched_name": "Jameson Williams",
                        "original sentence": "So he lost two targets per game because Jameson Williams took a big step up.",
                        "player_id": "4426388",
                        "score": 100,
                        "sentence": "So he lost two targets per game because Jameson Williams took a big step up.",
                        "sentence_index": 485,
                        "status": "perfect match",
                        "transcript_name": "Jameson Williams"
                    },
                    {
                        "matched_name": "Jameson Williams",
                        "original sentence": "And we saw Jameson Williams clearly establish himself as a number two target at offense.",
                        "player_id": "4426388",
                        "score": 100,
                        "sentence": "And we saw Jameson Williams clearly establish himself as a number two target at offense.",
                        "sentence_index": 492,
                        "status": "perfect match",
                        "transcript_name": "Jameson Williams"
                    },
                    {
                        "matched_name": "Jameson Williams",
                        "original sentence": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent.",
                        "player_id": "4426388",
                        "score": 100,
                        "sentence": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent.",
                        "sentence_index": 500,
                        "status": "perfect match",
                        "transcript_name": "Jameson Williams"
                    },
                    {
                        "matched_name": "Jameson Williams",
                        "original sentence": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent.",
                        "player_id": "4426388",
                        "score": 100,
                        "sentence": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent.",
                        "sentence_index": 500,
                        "status": "perfect match",
                        "transcript_name": "Jameson Williams"
                    },
                    {
                        "matched_name": "Jameson Williams",
                        "original sentence": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent.",
                        "player_id": "4426388",
                        "score": 100,
                        "sentence": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent.",
                        "sentence_index": 500,
                        "status": "perfect match",
                        "transcript_name": "Jameson Williams"
                    }
                ]
            },
            "Jaxson Dart": {
                "mentioned_sentence_indexes": [
                    499
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Jaxson Dart",
                        "original sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
                        "player_id": "4689114",
                        "score": 87,
                        "sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jaxson Dart.",
                        "sentence_index": 499,
                        "status": "best of multiple matches",
                        "transcript_name": "Jackson Dart"
                    }
                ]
            },
            "Jayden Daniels": {
                "mentioned_sentence_indexes": [
                    635
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Jayden Daniels",
                        "original sentence": "Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year.",
                        "player_id": "4426348",
                        "score": 96,
                        "sentence": "Obviously, year two with um Jayden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year.",
                        "sentence_index": 635,
                        "status": "best of multiple matches",
                        "transcript_name": "Jaden Daniels"
                    }
                ]
            },
            "Jerry Jeudy": {
                "mentioned_sentence_indexes": [
                    152,
                    145,
                    148
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Jerry Jeudy",
                        "original sentence": "Like, it I like Jerry Jeudy as well.",
                        "player_id": "4241463",
                        "score": 100,
                        "sentence": "Like, it I like Jerry Jeudy as well.",
                        "sentence_index": 145,
                        "status": "perfect match",
                        "transcript_name": "Jerry Jeudy"
                    },
                    {
                        "matched_name": "Jerry Jeudy",
                        "original sentence": "That's I'm a little bit lower on Jerry Jeudy than probably like I think than Rich because I think it's going to be the David Njoku show.",
                        "player_id": "4241463",
                        "score": 100,
                        "sentence": "That's I'm a little bit lower on Jerry Jeudy than probably like I think than Rich because I think it's going to be the David Njoku show.",
                        "sentence_index": 148,
                        "status": "perfect match",
                        "transcript_name": "Jerry Jeudy"
                    },
                    {
                        "matched_name": "Jerry Jeudy",
                        "original sentence": "Um as far as uh Jerry Jeudy and and Joe Flacco, but I I think I think David Njoku and him have proven over time that you know obviously they have a really really strong connection.",
                        "player_id": "4241463",
                        "score": 100,
                        "sentence": "Um as far as uh Jerry Jeudy and and Joe Flacco, but I I think I think David Njoku and him have proven over time that you know obviously they have a really really strong connection.",
                        "sentence_index": 152,
                        "status": "perfect match",
                        "transcript_name": "Jerry Jeudy"
                    }
                ]
            },
            "Joe Flacco": {
                "mentioned_sentence_indexes": [
                    192,
                    162,
                    260,
                    261,
                    138,
                    270,
                    152,
                    184
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Joe Flacco",
                        "original sentence": "The easiest thing to do is just look at what he did with Joe Flacco before.",
                        "player_id": "11252",
                        "score": 100,
                        "sentence": "The easiest thing to do is just look at what he did with Joe Flacco before.",
                        "sentence_index": 138,
                        "status": "perfect match",
                        "transcript_name": "Joe Flacco"
                    },
                    {
                        "matched_name": "Joe Flacco",
                        "original sentence": "Um as far as uh Jerry Jeudy and and Joe Flacco, but I I think I think David Njoku and him have proven over time that you know obviously they have a really really strong connection.",
                        "player_id": "11252",
                        "score": 100,
                        "sentence": "Um as far as uh Jerry Jeudy and and Joe Flacco, but I I think I think David Njoku and him have proven over time that you know obviously they have a really really strong connection.",
                        "sentence_index": 152,
                        "status": "perfect match",
                        "transcript_name": "Joe Flacco"
                    },
                    {
                        "matched_name": "Joe Flacco",
                        "original sentence": "So, you have that and you get Joe Flaccco back.",
                        "player_id": "11252",
                        "score": 95,
                        "sentence": "So, you have that and you get Joe Flacco back.",
                        "sentence_index": 162,
                        "status": "perfect match",
                        "transcript_name": "Joe Flaccco"
                    },
                    {
                        "matched_name": "Joe Flacco",
                        "original sentence": "So I think with the quarterback play he's a get from Joe Flacco.",
                        "player_id": "11252",
                        "score": 100,
                        "sentence": "So I think with the quarterback play he's a get from Joe Flacco.",
                        "sentence_index": 184,
                        "status": "perfect match",
                        "transcript_name": "Joe Flacco"
                    },
                    {
                        "matched_name": "Joe Flacco",
                        "original sentence": "I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Jok.",
                        "player_id": "11252",
                        "score": 100,
                        "sentence": "I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Jok.",
                        "sentence_index": 192,
                        "status": "perfect match",
                        "transcript_name": "Joe Flacco"
                    },
                    {
                        "matched_name": "Joe Flacco",
                        "original sentence": "I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram.",
                        "player_id": "11252",
                        "score": 100,
                        "sentence": "I think if if I knew that Joe Flacco was going to be there and be the starter all year round all year, I would say for sure and David and David Njoku over Evan Engram.",
                        "sentence_index": 260,
                        "status": "perfect match",
                        "transcript_name": "Joe Flacco"
                    },
                    {
                        "matched_name": "Joe Flacco",
                        "original sentence": "I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront.",
                        "player_id": "11252",
                        "score": 100,
                        "sentence": "I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront.",
                        "sentence_index": 261,
                        "status": "perfect match",
                        "transcript_name": "Joe Flacco"
                    },
                    {
                        "matched_name": "Joe Flacco",
                        "original sentence": "I think Flacco does I think you're giving Joe Flacco the start all the way through the London game which is the Vikings.",
                        "player_id": "11252",
                        "score": 100,
                        "sentence": "I think Joe Flacco does I think you're giving Joe Joe Flacco the start all the way through the London game which is the Vikings.",
                        "sentence_index": 270,
                        "status": "perfect match",
                        "transcript_name": "Flacco"
                    },
                    {
                        "matched_name": "Joe Flacco",
                        "original sentence": "I think Flacco does I think you're giving Joe Flacco the start all the way through the London game which is the Vikings.",
                        "player_id": "11252",
                        "score": 100,
                        "sentence": "I think Flacco does I think you're giving Joe Flacco the start all the way through the London game which is the Vikings.",
                        "sentence_index": 270,
                        "status": "perfect match",
                        "transcript_name": "Joe Flacco"
                    }
                ]
            },
            "John Bates": {
                "mentioned_sentence_indexes": [
                    636
                ],
                "occurrence_array": [
                    {
                        "matched_name": "John Bates",
                        "original sentence": "really hasn't come together for Ben um yet and had a rough camper I heard rather yeah even even in camp hasn't been great so I think that's going to make them kind of rely on Z even more John Bates is a fine tight end he's just not going to be a factor in the pass catching realm and Z had a really good kick right and Z has looked great so um I think you know last year he was at tight end seven and this is actually a step back you know what I mean getting him in at tight end 11 just because I think there is going to be some sort of negative effect with with Debo being there I just don't think it's I think it can be offset by things like like like touchdowns.",
                        "player_id": "4048228",
                        "score": 100,
                        "sentence": "really hasn't come together for Ben um yet and had a rough camper I heard rather yeah even even in camp hasn't been great so I think that's going to make them kind of rely on Z even more John Bates is a fine tight end he's just not going to be a factor in the pass catching realm and Z had a really good kick right and Z has looked great so um I think you know last year he was at tight end seven and this is actually a step back you know what I mean getting him in at tight end 11 just because I think there is going to be some sort of negative effect with with Debo being there I just don't think it's I think it can be offset by things like like like touchdowns.",
                        "sentence_index": 636,
                        "status": "perfect match",
                        "transcript_name": "John Bates"
                    }
                ]
            },
            "Jordan Addison": {
                "mentioned_sentence_indexes": [
                    444
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Jordan Addison",
                        "original sentence": "I think that Jordan missing a couple games is enough to really propel him.",
                        "player_id": "4429205",
                        "score": 100,
                        "sentence": "I think that Jordan Addison missing a couple games is enough to really propel him.",
                        "sentence_index": 444,
                        "status": "best of multiple matches",
                        "transcript_name": "Jordan"
                    }
                ]
            },
            "Josh Downs": {
                "mentioned_sentence_indexes": [
                    879
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Josh Downs",
                        "original sentence": "So with those reports saying like we said, I like Josh Downs a ton.",
                        "player_id": "4688813",
                        "score": 100,
                        "sentence": "So with those reports saying like we said, I like Josh Downs a ton.",
                        "sentence_index": 879,
                        "status": "perfect match",
                        "transcript_name": "Josh Downs"
                    }
                ]
            },
            "Josh Smith": {
                "mentioned_sentence_indexes": [
                    669
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Josh Smith",
                        "original sentence": "I I found a path for John Smith with paired back up with Arthur Smith to be the clear number two option in Pittsburgh.",
                        "player_id": "3915778",
                        "score": 90,
                        "sentence": "I I found a path for Josh Smith with paired back up with Arthur Smith to be the clear number two option in Pittsburgh.",
                        "sentence_index": 669,
                        "status": "best of multiple matches",
                        "transcript_name": "John Smith"
                    }
                ]
            },
            "Justin Herbert": {
                "mentioned_sentence_indexes": [
                    782
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Justin Herbert",
                        "original sentence": "What if he's finally the guy that joins Justin Herbert?",
                        "player_id": "4038941",
                        "score": 100,
                        "sentence": "What if he's finally the guy that joins Justin Herbert?",
                        "sentence_index": 782,
                        "status": "perfect match",
                        "transcript_name": "Justin Herbert"
                    }
                ]
            },
            "Justin Jefferson": {
                "mentioned_sentence_indexes": [
                    448
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Justin Jefferson",
                        "original sentence": "I think Kevin Okonnell could trust T.J. Hockenson enough to be JJ safety enough as well on top of having a guy like Justin Jefferson.",
                        "player_id": "4262921",
                        "score": 100,
                        "sentence": "I think Kevin Okonnell could trust T.J. Hockenson enough to be JJ safety enough as well on top of having a guy like Justin Jefferson.",
                        "sentence_index": 448,
                        "status": "perfect match",
                        "transcript_name": "Justin Jefferson"
                    }
                ]
            },
            "Kenny Pickett": {
                "mentioned_sentence_indexes": [
                    266,
                    171
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Kenny Pickett",
                        "original sentence": "Do you guys have any concern that hey, they got rid of Kenny Kenny Picket?",
                        "player_id": "4240703",
                        "score": 96,
                        "sentence": "Do you guys have any concern that hey, they got rid of Kenny Pickett?",
                        "sentence_index": 171,
                        "status": "perfect match",
                        "transcript_name": "Kenny Kenny Picket"
                    },
                    {
                        "matched_name": "Kenny Pickett",
                        "original sentence": "And I think that is I think especially with with the trading away of Kenny Picket that signals that that path even more to me.",
                        "player_id": "4240703",
                        "score": 96,
                        "sentence": "And I think that is I think especially with with the trading away of Kenny Pickett that signals that that path even more to me.",
                        "sentence_index": 266,
                        "status": "perfect match",
                        "transcript_name": "Kenny Picket"
                    }
                ]
            },
            "Keon Coleman": {
                "mentioned_sentence_indexes": [
                    680
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Keon Coleman",
                        "original sentence": "So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid?",
                        "player_id": "4635008",
                        "score": 100,
                        "sentence": "So like does Keon Coleman step up in as the number one weapon in this offense or is it Dalton Kincaid?",
                        "sentence_index": 680,
                        "status": "perfect match",
                        "transcript_name": "Keon Coleman"
                    }
                ]
            },
            "Khalil Shakir": {
                "mentioned_sentence_indexes": [
                    681
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Khalil Shakir",
                        "original sentence": "I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around.",
                        "player_id": "4373678",
                        "score": 100,
                        "sentence": "I'm gonna put my money on Dalton Kincaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around.",
                        "sentence_index": 681,
                        "status": "perfect match",
                        "transcript_name": "Khalil Shakir"
                    }
                ]
            },
            "Kyle Pitts Sr.": {
                "mentioned_sentence_indexes": [
                    705,
                    771,
                    587,
                    749,
                    724,
                    698,
                    699,
                    702,
                    767
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Kyle Pitts Sr.",
                        "original sentence": "And at 12 I have Kyle Pitts.",
                        "player_id": "4360248",
                        "score": 100,
                        "sentence": "And at 12 I have Kyle Pitts Sr..",
                        "sentence_index": 587,
                        "status": "perfect match",
                        "transcript_name": "Kyle Pitts"
                    },
                    {
                        "matched_name": "Kyle Pitts Sr.",
                        "original sentence": "I think the only one that I didn't hear you guys say that I did have was Kyle Pitts.",
                        "player_id": "4360248",
                        "score": 100,
                        "sentence": "I think the only one that I didn't hear you guys say that I did have was Kyle Pitts Sr..",
                        "sentence_index": 698,
                        "status": "perfect match",
                        "transcript_name": "Kyle Pitts"
                    },
                    {
                        "matched_name": "Kyle Pitts Sr.",
                        "original sentence": "Did you Nobody had Kyle Pitts in there?",
                        "player_id": "4360248",
                        "score": 100,
                        "sentence": "Did you Nobody had Kyle Pitts Sr. in there?",
                        "sentence_index": 699,
                        "status": "perfect match",
                        "transcript_name": "Kyle Pitts"
                    },
                    {
                        "matched_name": "Kyle Pitts Sr.",
                        "original sentence": "So this is maybe not quite the same love, but Kyle Pitts is a player that Yes.",
                        "player_id": "4360248",
                        "score": 100,
                        "sentence": "So this is maybe not quite the same love, but Kyle Pitts Sr. is a player that Yes.",
                        "sentence_index": 702,
                        "status": "perfect match",
                        "transcript_name": "Kyle Pitts"
                    },
                    {
                        "matched_name": "Kyle Pitts Sr.",
                        "original sentence": "Um granted, it's what they should say, but all signs point to them saying like, \"No, we must get Kyle Pitts the football.\"",
                        "player_id": "4360248",
                        "score": 100,
                        "sentence": "Um granted, it's what they should say, but all signs point to them saying like, \"No, we must get Kyle Pitts Sr. the football.\"",
                        "sentence_index": 705,
                        "status": "perfect match",
                        "transcript_name": "Kyle Pitts"
                    },
                    {
                        "matched_name": "Kyle Pitts Sr.",
                        "original sentence": "Yeah, I mean obviously he's besides his rookie year hasn't done anything that would indicate that you want the Atlanta Falcons picked up Kyle Pitt's fifth year contract option on April 29th.",
                        "player_id": "4360248",
                        "score": 92,
                        "sentence": "Yeah, I mean obviously he's besides his rookie year hasn't done anything that would indicate that you want the Atlanta Falcons picked up Kyle Pitts Sr. fifth year contract option on April 29th.",
                        "sentence_index": 724,
                        "status": "perfect match",
                        "transcript_name": "Kyle Pitt's"
                    },
                    {
                        "matched_name": "Kyle Pitts Sr.",
                        "original sentence": "I feel more comfortable about all them than Kyle Pitts.",
                        "player_id": "4360248",
                        "score": 100,
                        "sentence": "I feel more comfortable about all them than Kyle Pitts Sr..",
                        "sentence_index": 749,
                        "status": "perfect match",
                        "transcript_name": "Kyle Pitts"
                    },
                    {
                        "matched_name": "Kyle Pitts Sr.",
                        "original sentence": "And it's the thing what Kyle Pitts cost you compared to what you give Hunter Henry for.",
                        "player_id": "4360248",
                        "score": 100,
                        "sentence": "And it's the thing what Kyle Pitts Sr. cost you compared to what you give Hunter Henry for.",
                        "sentence_index": 767,
                        "status": "perfect match",
                        "transcript_name": "Kyle Pitts"
                    },
                    {
                        "matched_name": "Kyle Pitts Sr.",
                        "original sentence": "And like if you still have Kyle Pitts, you're not definitely you'd rather just hope and hold on and go down with the ship, right?",
                        "player_id": "4360248",
                        "score": 100,
                        "sentence": "And like if you still have Kyle Pitts Sr., you're not definitely you'd rather just hope and hold on and go down with the ship, right?",
                        "sentence_index": 771,
                        "status": "perfect match",
                        "transcript_name": "Kyle Pitts"
                    }
                ]
            },
            "Kyle Williams": {
                "mentioned_sentence_indexes": [
                    654
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Kyle Williams",
                        "original sentence": "We we do have Kyle Williams there now.",
                        "player_id": "4613202",
                        "score": 100,
                        "sentence": "We we do have Kyle Williams there now.",
                        "sentence_index": 654,
                        "status": "perfect match",
                        "transcript_name": "Kyle Williams"
                    }
                ]
            },
            "Kyler Murray": {
                "mentioned_sentence_indexes": [
                    179
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Kyler Murray",
                        "original sentence": "Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense.",
                        "player_id": "3917315",
                        "score": 100,
                        "sentence": "Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense.",
                        "sentence_index": 179,
                        "status": "perfect match",
                        "transcript_name": "Kyler Murray"
                    }
                ]
            },
            "Mark Andrews": {
                "mentioned_sentence_indexes": [
                    803,
                    585,
                    809,
                    814,
                    624,
                    697,
                    629,
                    601
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Mark Andrews",
                        "original sentence": "At 10 I have Mark Andrews.",
                        "player_id": "3116365",
                        "score": 100,
                        "sentence": "At 10 I have Mark Andrews.",
                        "sentence_index": 585,
                        "status": "perfect match",
                        "transcript_name": "Mark Andrews"
                    },
                    {
                        "matched_name": "Mark Andrews",
                        "original sentence": "Um, Mark 10 10 Mark Andrews, 11 Zach Ertz.",
                        "player_id": "3116365",
                        "score": 100,
                        "sentence": "Um, Mark 10 10 Mark Andrews, 11 Zach Ertz.",
                        "sentence_index": 601,
                        "status": "perfect match",
                        "transcript_name": "Mark Andrews"
                    },
                    {
                        "matched_name": "Mark Andrews",
                        "original sentence": "Mark Andrews at 11.",
                        "player_id": "3116365",
                        "score": 100,
                        "sentence": "Mark Andrews at 11.",
                        "sentence_index": 624,
                        "status": "perfect match",
                        "transcript_name": "Mark Andrews"
                    },
                    {
                        "matched_name": "Mark Andrews",
                        "original sentence": "Uh Mark Andrews.",
                        "player_id": "3116365",
                        "score": 100,
                        "sentence": "Uh Mark Andrews.",
                        "sentence_index": 629,
                        "status": "perfect match",
                        "transcript_name": "Mark Andrews"
                    },
                    {
                        "matched_name": "Mark Andrews",
                        "original sentence": "I think everything else like we all had Mark Andrews in there.",
                        "player_id": "3116365",
                        "score": 100,
                        "sentence": "I think everything else like we all had Mark Andrews in there.",
                        "sentence_index": 697,
                        "status": "perfect match",
                        "transcript_name": "Mark Andrews"
                    },
                    {
                        "matched_name": "Mark Andrews",
                        "original sentence": "Mark Andrew's on our list.",
                        "player_id": "3116365",
                        "score": 96,
                        "sentence": "Mark Andrews's on our list.",
                        "sentence_index": 803,
                        "status": "perfect match",
                        "transcript_name": "Mark Andrew"
                    },
                    {
                        "matched_name": "Mark Andrews",
                        "original sentence": "Despite all that and despite that, Mark Andrews fell off like real hard early in the game.",
                        "player_id": "3116365",
                        "score": 100,
                        "sentence": "Despite all that and despite that, Mark Andrews fell off like real hard early in the game.",
                        "sentence_index": 809,
                        "status": "perfect match",
                        "transcript_name": "Mark Andrews"
                    },
                    {
                        "matched_name": "Mark Andrews",
                        "original sentence": "Mark Andrews finished as tight end six overall last year.",
                        "player_id": "3116365",
                        "score": 100,
                        "sentence": "Mark Andrews finished as tight end six overall last year.",
                        "sentence_index": 814,
                        "status": "perfect match",
                        "transcript_name": "Mark Andrews"
                    }
                ]
            },
            "Mason Taylor": {
                "mentioned_sentence_indexes": [
                    890,
                    891,
                    892
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Mason Taylor",
                        "original sentence": "Mason Taylor.",
                        "player_id": "4808766",
                        "score": 100,
                        "sentence": "Mason Taylor.",
                        "sentence_index": 890,
                        "status": "perfect match",
                        "transcript_name": "Mason Taylor"
                    },
                    {
                        "matched_name": "Mason Taylor",
                        "original sentence": "Mason Taylor.",
                        "player_id": "4808766",
                        "score": 100,
                        "sentence": "Mason Taylor.",
                        "sentence_index": 891,
                        "status": "perfect match",
                        "transcript_name": "Mason Taylor"
                    },
                    {
                        "matched_name": "Mason Taylor",
                        "original sentence": "Mason Taylor.",
                        "player_id": "4808766",
                        "score": 100,
                        "sentence": "Mason Taylor.",
                        "sentence_index": 892,
                        "status": "perfect match",
                        "transcript_name": "Mason Taylor"
                    }
                ]
            },
            "Michael Pittman Jr.": {
                "mentioned_sentence_indexes": [
                    880
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Michael Pittman Jr.",
                        "original sentence": "I like uh Michael Pitman as well.",
                        "player_id": "4035687",
                        "score": 88,
                        "sentence": "I like uh Michael Pittman Jr. as well.",
                        "sentence_index": 880,
                        "status": "perfect match",
                        "transcript_name": "Michael Pitman"
                    }
                ]
            },
            "RJ Harvey": {
                "mentioned_sentence_indexes": [
                    224,
                    227,
                    499
                ],
                "occurrence_array": [
                    {
                        "matched_name": "RJ Harvey",
                        "original sentence": "Him and R.J. Harvey, which I think R.J. Harvey is going to have a role this year.",
                        "player_id": "4568490",
                        "score": 84,
                        "sentence": "Him and RJ Harvey, which I think RJ Harvey is going to have a role this year.",
                        "sentence_index": 224,
                        "status": "perfect match",
                        "transcript_name": "R.J. Harvey"
                    },
                    {
                        "matched_name": "RJ Harvey",
                        "original sentence": "Him and R.J. Harvey, which I think R.J. Harvey is going to have a role this year.",
                        "player_id": "4568490",
                        "score": 84,
                        "sentence": "Him and RJ Harvey, which I think RJ Harvey is going to have a role this year.",
                        "sentence_index": 224,
                        "status": "perfect match",
                        "transcript_name": "R.J. Harvey"
                    },
                    {
                        "matched_name": "RJ Harvey",
                        "original sentence": "And RJ Harvey's not even going to play on third downs.",
                        "player_id": "4568490",
                        "score": 100,
                        "sentence": "And RJ Harvey's not even going to play on third downs.",
                        "sentence_index": 227,
                        "status": "perfect match",
                        "transcript_name": "RJ Harvey"
                    },
                    {
                        "matched_name": "RJ Harvey",
                        "original sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
                        "player_id": "4568490",
                        "score": 100,
                        "sentence": "Yeah, David and David Njoku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
                        "sentence_index": 499,
                        "status": "perfect match",
                        "transcript_name": "RJ Harvey"
                    }
                ]
            },
            "Sam Acho": {
                "mentioned_sentence_indexes": [
                    498
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Sam Acho",
                        "original sentence": "Sam Sam or I'm sorry um David and David Njoku.",
                        "player_id": "14152",
                        "score": 100,
                        "sentence": "Sam Acho or I'm sorry um David and David Njoku.",
                        "sentence_index": 498,
                        "status": "best of multiple matches",
                        "transcript_name": "Sam Sam"
                    }
                ]
            },
            "Sam LaPorta": {
                "mentioned_sentence_indexes": [
                    129,
                    513,
                    514,
                    450,
                    584,
                    591,
                    464,
                    466,
                    468,
                    474,
                    858,
                    477,
                    479,
                    482,
                    487,
                    488,
                    620,
                    497,
                    500,
                    508,
                    511
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "So, like if I miss out on George Kittle to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam LePorta is going to usually go tight end four there.",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "So, like if I miss out on George Kittle to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam LaPorta is going to usually go tight end four there.",
                        "sentence_index": 129,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "I have him in my own tier, but like if he finishes tight end five, um if Sam LePorta was tight end five, if Tucker Tucker Kraft was tight end five, that does not shock me.",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "I have him in my own tier, but like if he finishes tight end five, um if Sam LaPorta was tight end five, if Tucker Tucker Kraft was tight end five, that does not shock me.",
                        "sentence_index": 450,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "Uh and then for me, I have at seven, I have Sam LePorta.",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "Uh and then for me, I have at seven, I have Sam LaPorta.",
                        "sentence_index": 464,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam LePorta he's the 51st guy off the board then",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam LaPorta he's the 51st guy off the board then",
                        "sentence_index": 466,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "Tucker Tucker Kraft's 108 um so I mean he's significantly ahead of those guys so for me Sam Sam LePorta",
                        "player_id": "4430027",
                        "score": 96,
                        "sentence": "Tucker Tucker Kraft's 108 um so I mean he's significantly ahead of those guys so for me Sam Sam LePorta",
                        "sentence_index": 468,
                        "status": "perfect match",
                        "transcript_name": "Sam Leaporta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "And Sam LePorta was eight last year.",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "And Sam LaPorta was eight last year.",
                        "sentence_index": 474,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "So, I mean, I came on a show six months ago and I brought this up and I said, \"Man, one of my biggest sells right now and tight end premium or in fantasy right now is Sam LePorta.\"",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "So, I mean, I came on a show six months ago and I brought this up and I said, \"Man, one of my biggest sells right now and tight end premium or in fantasy right now is Sam LaPorta.\"",
                        "sentence_index": 477,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "And I said, this has nothing to do with Sam LePorta.",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "And I said, this has nothing to do with Sam LaPorta.",
                        "sentence_index": 479,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "I feel going forward Sam LePorta, which is again a very solid asset to own, is gonna live in tight end six to eight range consistently.",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "I feel going forward Sam LaPorta, which is again a very solid asset to own, is gonna live in tight end six to eight range consistently.",
                        "sentence_index": 482,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LePorta.",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "It was like well George Kittle can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam LaPorta.",
                        "sentence_index": 487,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "If he if one of those guys goes down and Sam LePorta all of a sudden gets more of the target share because those naturally they're just out of the offense, then yeah, he can bump way the heck up.",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "If he if one of those guys goes down and Sam LaPorta all of a sudden gets more of the target share because those naturally they're just out of the offense, then yeah, he can bump way the heck up.",
                        "sentence_index": 488,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "And just imagine if you got you sold David Sam LePorta for David and David Njoku in like 111 and now you can sit there either with Sam LePorta and like Caleb Johnson.",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "And just imagine if you got you sold David Sam LaPorta for David and David Njoku in like 111 and now you can sit there either with Sam LaPorta and like Caleb Johnson.",
                        "sentence_index": 497,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent.",
                        "player_id": "4430027",
                        "score": 96,
                        "sentence": "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Sam LePorta I really do I think He's an amazing talent.",
                        "sentence_index": 500,
                        "status": "perfect match",
                        "transcript_name": "Sam Leaporta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "So, is there a path for Sam LePorta to join those elite guys again?",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "So, is there a path for Sam LaPorta to join those elite guys again?",
                        "sentence_index": 508,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "But as things stand now, Sam LePorta to me fits right where he finished last year.",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "But as things stand now, Sam LaPorta to me fits right where he finished last year.",
                        "sentence_index": 511,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus and I get a significant plus than having Sam Sam LePorta.",
                        "player_id": "4430027",
                        "score": 96,
                        "sentence": "Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus and I get a significant plus than having Sam Sam LePorta.",
                        "sentence_index": 513,
                        "status": "perfect match",
                        "transcript_name": "Sam Leaporta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "Now, can I settle with Sam LePorta in Dynasty?",
                        "player_id": "4430027",
                        "score": 91,
                        "sentence": "Now, can I settle with Sam LaPorta in Dynasty?",
                        "sentence_index": 514,
                        "status": "perfect match",
                        "transcript_name": "Sam LePorta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine.",
                        "player_id": "4430027",
                        "score": 96,
                        "sentence": "We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine.",
                        "sentence_index": 584,
                        "status": "perfect match",
                        "transcript_name": "Sam Leaporta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "All right 6 through 12 I went uh Travis Kelce Sam Sam LePorta at seven at eight I went Colston Loveland.",
                        "player_id": "4430027",
                        "score": 96,
                        "sentence": "All right 6 through 12 I went uh Travis Kelce Sam Sam LePorta at seven at eight I went Colston Loveland.",
                        "sentence_index": 591,
                        "status": "perfect match",
                        "transcript_name": "Sam Leaporta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine.",
                        "player_id": "4430027",
                        "score": 96,
                        "sentence": "So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine.",
                        "sentence_index": 620,
                        "status": "perfect match",
                        "transcript_name": "Sam Leaporta"
                    },
                    {
                        "matched_name": "Sam LaPorta",
                        "original sentence": "Sam Sam LePorta comes directly to mind his rookie year when he finished as I think tight end two or three.",
                        "player_id": "4430027",
                        "score": 96,
                        "sentence": "Sam Sam LePorta comes directly to mind his rookie year when he finished as I think tight end two or three.",
                        "sentence_index": 858,
                        "status": "perfect match",
                        "transcript_name": "Sam Leaporta"
                    }
                ]
            },
            "Sean Chandler": {
                "mentioned_sentence_indexes": [
                    960,
                    957
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Sean Chandler",
                        "original sentence": "He reads it wrong to Sean.",
                        "player_id": "3138733",
                        "score": 100,
                        "sentence": "He reads it wrong to Sean Chandler.",
                        "sentence_index": 957,
                        "status": "best of multiple matches",
                        "transcript_name": "Sean"
                    },
                    {
                        "matched_name": "Sean Chandler",
                        "original sentence": "Uh, that's analyst Sean.",
                        "player_id": "3138733",
                        "score": 100,
                        "sentence": "Uh, that's analyst Sean Chandler.",
                        "sentence_index": 960,
                        "status": "best of multiple matches",
                        "transcript_name": "Sean"
                    }
                ]
            },
            "Shedeur Sanders": {
                "mentioned_sentence_indexes": [
                    281
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Shedeur Sanders",
                        "original sentence": "Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback.",
                        "player_id": "4432762",
                        "score": 90,
                        "sentence": "Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shedeur Sanders way ahead of Dillon Gabriel but like the Browns love Dillon Gabriel and they've done that throughout camp they've done it through um this point they just named today Dillon Gabriel the number two quarterback.",
                        "sentence_index": 281,
                        "status": "perfect match",
                        "transcript_name": "Shadur Sanders"
                    }
                ]
            },
            "Solomon Ajayi": {
                "mentioned_sentence_indexes": [
                    788
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Solomon Ajayi",
                        "original sentence": "Solomon knows.",
                        "player_id": "4246885",
                        "score": 100,
                        "sentence": "Solomon Ajayi knows.",
                        "sentence_index": 788,
                        "status": "best of multiple matches",
                        "transcript_name": "Solomon"
                    }
                ]
            },
            "Stefon Diggs": {
                "mentioned_sentence_indexes": [
                    653
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Stefon Diggs",
                        "original sentence": "Uh we do have Stefon Diggs there.",
                        "player_id": "2976212",
                        "score": 100,
                        "sentence": "Uh we do have Stefon Diggs there.",
                        "sentence_index": 653,
                        "status": "perfect match",
                        "transcript_name": "Stefon Diggs"
                    }
                ]
            },
            "T.J. Hockenson": {
                "mentioned_sentence_indexes": [
                    384,
                    416,
                    130,
                    386,
                    448,
                    449,
                    451,
                    584,
                    393,
                    447,
                    457,
                    458,
                    620,
                    404,
                    412,
                    413,
                    383
                ],
                "occurrence_array": [
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "T.J. Hockenson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier.",
                        "sentence_index": 130,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "I have T.J. Hockenson at six.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "I have T.J. Hockenson at six.",
                        "sentence_index": 383,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "I have T.J. Hockenson at six as well.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "I have T.J. Hockenson at six as well.",
                        "sentence_index": 384,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "Where do you have T.J. Hockenson?",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "Where do you have T.J. Hockenson?",
                        "sentence_index": 386,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "Um, no, I don't have a lot of con I don't have a lot of conviction about about T.J. Hockenson here at 12.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "Um, no, I don't have a lot of con I don't have a lot of conviction about about T.J. Hockenson here at 12.",
                        "sentence_index": 393,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "It's why I w I thought about putting T.J. Hockenson higher.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "It's why I w I thought about putting T.J. Hockenson higher.",
                        "sentence_index": 404,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "So, I mean, we could see we could obviously see T.J. Hockenson being much higher than where I have him.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "So, I mean, we could see we could obviously see T.J. Hockenson being much higher than where I have him.",
                        "sentence_index": 412,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "And and I think, you know, it was just more of a factor of getting other guys in above him and kind of at the end going, I need to get um T.J. Hockenson into this top 12.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "And and I think, you know, it was just more of a factor of getting other guys in above him and kind of at the end going, I need to get um T.J. Hockenson into this top 12.",
                        "sentence_index": 413,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "So that's why T.J. Hockenson ended up 12.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "So that's why T.J. Hockenson ended up 12.",
                        "sentence_index": 416,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "I think T.J. Hockenson kind of felt um find himself in that position.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "I think T.J. Hockenson kind of felt um find himself in that position.",
                        "sentence_index": 447,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "I think Kevin Okonnell could trust T.J. Hockenson enough to be JJ safety enough as well on top of having a guy like Justin Jefferson.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "I think Kevin Okonnell could trust T.J. Hockenson enough to be JJ safety enough as well on top of having a guy like Justin Jefferson.",
                        "sentence_index": 448,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high but like I said when I get to tight end 678 so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high but like I said when I get to tight end 678 so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you.",
                        "sentence_index": 449,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "So even though I have T.J. Hockenson at six, I'm with you in the tier group.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "So even though I have T.J. Hockenson at six, I'm with you in the tier group.",
                        "sentence_index": 451,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "So I do like you have T.J. Hockenson at six as well.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "So I do like you have T.J. Hockenson at six as well.",
                        "sentence_index": 457,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "I have T.J. Hockenson at six as well.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "I have T.J. Hockenson at six as well.",
                        "sentence_index": 458,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine.",
                        "sentence_index": 584,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    },
                    {
                        "matched_name": "T.J. Hockenson",
                        "original sentence": "So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine.",
                        "player_id": "4036133",
                        "score": 100,
                        "sentence": "So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine.",
                        "sentence_index": 620,
                        "status": "perfect match",
                        "transcript_name": "T.J. Hockenson"
                    }
                ]
            },
            "Taylor Bertolet": {
                "mentioned_sentence_indexes": [
                    320,
                    311
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Taylor Bertolet",
                        "original sentence": "My birdie had told me that Travis and Taylor would be getting engaged soon.",
                        "player_id": "2578718",
                        "score": 100,
                        "sentence": "My birdie had told me that Travis and Taylor Bertolet would be getting engaged soon.",
                        "sentence_index": 311,
                        "status": "best of multiple matches",
                        "transcript_name": "Taylor"
                    },
                    {
                        "matched_name": "Taylor Bertolet",
                        "original sentence": "Taylor I to be honest with you everything I've heard about her is like first of all my wife wanted to watch that podcast when she was on New Heights.",
                        "player_id": "2578718",
                        "score": 100,
                        "sentence": "Taylor Bertolet I to be honest with you everything I've heard about her is like first of all my wife wanted to watch that podcast when she was on New Heights.",
                        "sentence_index": 320,
                        "status": "best of multiple matches",
                        "transcript_name": "Taylor"
                    }
                ]
            },
            "Terry Beckner Jr.": {
                "mentioned_sentence_indexes": [
                    635
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Terry Beckner Jr.",
                        "original sentence": "Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year.",
                        "player_id": "3924310",
                        "score": 100,
                        "sentence": "Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry Beckner Jr. in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Ben Sinnott last year.",
                        "sentence_index": 635,
                        "status": "best of multiple matches",
                        "transcript_name": "Terry"
                    }
                ]
            },
            "Thomas Booker IV": {
                "mentioned_sentence_indexes": [
                    156
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Thomas Booker IV",
                        "original sentence": "Jameus Winston, uh, Thomas, uh, I even forget his name now.",
                        "player_id": "4360749",
                        "score": 100,
                        "sentence": "Jameus Winston, uh, Thomas Booker IV, uh, I even forget his name now.",
                        "sentence_index": 156,
                        "status": "best of multiple matches",
                        "transcript_name": "Thomas"
                    }
                ]
            },
            "Travis Bell": {
                "mentioned_sentence_indexes": [
                    381,
                    311
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Travis Bell",
                        "original sentence": "My birdie had told me that Travis and Taylor would be getting engaged soon.",
                        "player_id": "4246741",
                        "score": 100,
                        "sentence": "My birdie had told me that Travis Bell and Taylor would be getting engaged soon.",
                        "sentence_index": 311,
                        "status": "best of multiple matches",
                        "transcript_name": "Travis"
                    },
                    {
                        "matched_name": "Travis Bell",
                        "original sentence": "Oh yeah, Evan Engram four Jou five and then Travis G.",
                        "player_id": "4246741",
                        "score": 86,
                        "sentence": "Oh yeah, Evan Engram four Jou five and then Travis Bell",
                        "sentence_index": 381,
                        "status": "best of multiple matches",
                        "transcript_name": "Travis G."
                    }
                ]
            },
            "Travis Kelce": {
                "mentioned_sentence_indexes": [
                    357,
                    297,
                    365,
                    622,
                    591,
                    370,
                    786,
                    345,
                    924
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Travis Kelce",
                        "original sentence": "Uh, I put Travis Kelce there.",
                        "player_id": "15847",
                        "score": 100,
                        "sentence": "Uh, I put Travis Kelce there.",
                        "sentence_index": 297,
                        "status": "perfect match",
                        "transcript_name": "Travis Kelce"
                    },
                    {
                        "matched_name": "Travis Kelce",
                        "original sentence": "So, um you have Travis Kelce at five.",
                        "player_id": "15847",
                        "score": 100,
                        "sentence": "So, um you have Travis Kelce at five.",
                        "sentence_index": 345,
                        "status": "perfect match",
                        "transcript_name": "Travis Kelce"
                    },
                    {
                        "matched_name": "Travis Kelce",
                        "original sentence": "So, I think he takes away from Travis Kelce is what it is.",
                        "player_id": "15847",
                        "score": 100,
                        "sentence": "So, I think he takes away from Travis Kelce is what it is.",
                        "sentence_index": 357,
                        "status": "perfect match",
                        "transcript_name": "Travis Kelce"
                    },
                    {
                        "matched_name": "Travis Kelce",
                        "original sentence": "So, for me, it's just I think the Rashee Rice effect is what's going to take away from Travis Kelce just enough because it is so close.",
                        "player_id": "15847",
                        "score": 100,
                        "sentence": "So, for me, it's just I think the Rashee Rice effect is what's going to take away from Travis Kelce just enough because it is so close.",
                        "sentence_index": 365,
                        "status": "perfect match",
                        "transcript_name": "Travis Kelce"
                    },
                    {
                        "matched_name": "Travis Kelce",
                        "original sentence": "Where do you have tight end uh Travis Kelce Matt?",
                        "player_id": "15847",
                        "score": 100,
                        "sentence": "Where do you have tight end uh Travis Kelce Matt?",
                        "sentence_index": 370,
                        "status": "perfect match",
                        "transcript_name": "Travis Kelce"
                    },
                    {
                        "matched_name": "Travis Kelce",
                        "original sentence": "All right 6 through 12 I went uh Travis Kelce Sam Sam LePorta at seven at eight I went Colston Loveland.",
                        "player_id": "15847",
                        "score": 100,
                        "sentence": "All right 6 through 12 I went uh Travis Kelce Sam Sam LePorta at seven at eight I went Colston Loveland.",
                        "sentence_index": 591,
                        "status": "perfect match",
                        "transcript_name": "Travis Kelce"
                    },
                    {
                        "matched_name": "Travis Kelce",
                        "original sentence": "Uh Travis Kelce at 10.",
                        "player_id": "15847",
                        "score": 100,
                        "sentence": "Uh Travis Kelce at 10.",
                        "sentence_index": 622,
                        "status": "perfect match",
                        "transcript_name": "Travis Kelce"
                    },
                    {
                        "matched_name": "Travis Kelce",
                        "original sentence": "Or replaces Travis Kelce.",
                        "player_id": "15847",
                        "score": 100,
                        "sentence": "Or replaces Travis Kelce.",
                        "sentence_index": 786,
                        "status": "perfect match",
                        "transcript_name": "Travis Kelce"
                    },
                    {
                        "matched_name": "Travis Kelce",
                        "original sentence": "Travis Kelce obviously a little bit older.",
                        "player_id": "15847",
                        "score": 100,
                        "sentence": "Travis Kelce obviously a little bit older.",
                        "sentence_index": 924,
                        "status": "perfect match",
                        "transcript_name": "Travis Kelce"
                    }
                ]
            },
            "Trey McBride": {
                "mentioned_sentence_indexes": [
                    101,
                    109,
                    179,
                    84,
                    86
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Trey McBride",
                        "original sentence": "So Brock Bowers one, George Kittle two, Trey Trey McBride three.",
                        "player_id": "4361307",
                        "score": 100,
                        "sentence": "So Brock Bowers one, George Kittle two, Trey Trey McBride three.",
                        "sentence_index": 84,
                        "status": "perfect match",
                        "transcript_name": "Trey McBride"
                    },
                    {
                        "matched_name": "Trey McBride",
                        "original sentence": "I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish.",
                        "player_id": "4361307",
                        "score": 100,
                        "sentence": "I went Brock Bowers Trey Trey McBride Trey McBride then George Kittle same as last year's um finish.",
                        "sentence_index": 86,
                        "status": "perfect match",
                        "transcript_name": "Trey McBride McBride"
                    },
                    {
                        "matched_name": "Trey McBride",
                        "original sentence": "Trey Trey McBride 27.",
                        "player_id": "4361307",
                        "score": 100,
                        "sentence": "Trey Trey McBride 27.",
                        "sentence_index": 101,
                        "status": "perfect match",
                        "transcript_name": "Trey McBride"
                    },
                    {
                        "matched_name": "Trey McBride",
                        "original sentence": "Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is.",
                        "player_id": "4361307",
                        "score": 100,
                        "sentence": "Trey McBride goes like real quick after and I make sure I get George Kittle because that is where the value is.",
                        "sentence_index": 109,
                        "status": "perfect match",
                        "transcript_name": "Trey McBride"
                    },
                    {
                        "matched_name": "Trey McBride",
                        "original sentence": "Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense.",
                        "player_id": "4361307",
                        "score": 100,
                        "sentence": "Trey Trey McBride, you can argue is number one target with Kyler Murray in that offense.",
                        "sentence_index": 179,
                        "status": "perfect match",
                        "transcript_name": "Trey McBride"
                    }
                ]
            },
            "Tucker Kraft": {
                "mentioned_sentence_indexes": [
                    449,
                    450,
                    513,
                    929,
                    901,
                    931,
                    935,
                    584,
                    620,
                    913,
                    915,
                    468,
                    598,
                    920,
                    826,
                    574
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high but like I said when I get to tight end 678 so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high but like I said when I get to tight end 678 so my it goes to me it goes T.J. Hockenson Sam LePorta and Tucker Tucker Kraft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like T.J. Hockenson's talented enough like he could finish as tight end four and it wouldn't he could outproduce David Njoku I'm with you.",
                        "sentence_index": 449,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "I have him in my own tier, but like if he finishes tight end five, um if Sam LePorta was tight end five, if Tucker Tucker Kraft was tight end five, that does not shock me.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "I have him in my own tier, but like if he finishes tight end five, um if Sam LePorta was tight end five, if Tucker Tucker Kraft was tight end five, that does not shock me.",
                        "sentence_index": 450,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "Tucker Tucker Kraft's 108 um so I mean he's significantly ahead of those guys so for me Sam Sam LePorta",
                        "player_id": "4572680",
                        "score": 100,
                        "sentence": "Tucker Tucker Kraft's 108 um so I mean he's significantly ahead of those guys so for me Sam Sam LePorta",
                        "sentence_index": 468,
                        "status": "perfect match",
                        "transcript_name": "Tucker Kraft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus and I get a significant plus than having Sam Sam LePorta.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "Like I'd almost rather chase the upside of a guy like Tucker Tucker Kraft plus and I get a significant plus than having Sam Sam LePorta.",
                        "sentence_index": 513,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "Uh before we give because I know we're gonna talk about Tucker Tucker Kraft.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "Uh before we give because I know we're gonna talk about Tucker Tucker Kraft.",
                        "sentence_index": 574,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "We're not going to talk about the six player but just kind of so six through 12 T.J. Hockenson then Sam Sam LePorta, Evan Engram, Tucker Tucker Kraft at nine.",
                        "sentence_index": 584,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "I was like, uh, number nine, Tucker Tucker Kraft.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "I was like, uh, number nine, Tucker Tucker Kraft.",
                        "sentence_index": 598,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine.",
                        "sentence_index": 620,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "All right let's talk two rookies then we'll finish it off with Tucker Tucker Kraft talk.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "All right let's talk two rookies then we'll finish it off with Tucker Tucker Kraft talk.",
                        "sentence_index": 826,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "And then um so it leaves us with Tucker Tucker Kraft.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "And then um so it leaves us with Tucker Tucker Kraft.",
                        "sentence_index": 901,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "Um, when you have somebody who in her first year as being the main guy there excel uh with the ball in his hands like Tucker Tucker Kraft did, I see why he would say something like that with such a poperri of mystery at the receiver position.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "Um, when you have somebody who in her first year as being the main guy there excel uh with the ball in his hands like Tucker Tucker Kraft did, I see why he would say something like that with such a poperri of mystery at the receiver position.",
                        "sentence_index": 913,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "I think in the end it could be somebody like Tucker Tucker Kraft is the most valuable receiving weapon we see in that offense.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "I think in the end it could be somebody like Tucker Tucker Kraft is the most valuable receiving weapon we see in that offense.",
                        "sentence_index": 915,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "I ended at eight for Tucker Kraft for a reason because that was the last guy I saw that could propel up to like as high as five and it wouldn't shock me in the least.",
                        "player_id": "4572680",
                        "score": 100,
                        "sentence": "I ended at eight for Tucker Kraft for a reason because that was the last guy I saw that could propel up to like as high as five and it wouldn't shock me in the least.",
                        "sentence_index": 920,
                        "status": "perfect match",
                        "transcript_name": "Tucker Kraft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "So, I I think I think there's going to be a conversation, you know, about Tucker Tucker Kraft.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "So, I I think I think there's going to be a conversation, you know, about Tucker Tucker Kraft.",
                        "sentence_index": 929,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "So, this might be a nice opportunity while he's kind of had has a little bit of a depressed um value to kind of go out and say, \"Hey, let's let's make some moves for Tucker Kraft now because in two or three years, he's going to be a guy that's kind of up in this other echelon um nipping at at heels of the top tier.\"",
                        "player_id": "4572680",
                        "score": 100,
                        "sentence": "So, this might be a nice opportunity while he's kind of had has a little bit of a depressed um value to kind of go out and say, \"Hey, let's let's make some moves for Tucker Kraft now because in two or three years, he's going to be a guy that's kind of up in this other echelon um nipping at at heels of the top tier.\"",
                        "sentence_index": 931,
                        "status": "perfect match",
                        "transcript_name": "Tucker Kraft"
                    },
                    {
                        "matched_name": "Tucker Kraft",
                        "original sentence": "Yeah, and I don't I don't have much to add on Tucker Tucker Kraft.",
                        "player_id": "4572680",
                        "score": 92,
                        "sentence": "Yeah, and I don't I don't have much to add on Tucker Tucker Kraft.",
                        "sentence_index": 935,
                        "status": "perfect match",
                        "transcript_name": "Tucker Craft"
                    }
                ]
            },
            "Tyler Baron": {
                "mentioned_sentence_indexes": [
                    897
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Tyler Baron",
                        "original sentence": "Baron.",
                        "player_id": "4692555",
                        "score": 100,
                        "sentence": "Tyler Baron.",
                        "sentence_index": 897,
                        "status": "best of multiple matches",
                        "transcript_name": "Baron"
                    }
                ]
            },
            "Tyler Warren": {
                "mentioned_sentence_indexes": [
                    832,
                    874,
                    876,
                    620,
                    878,
                    885
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Tyler Warren",
                        "original sentence": "So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine.",
                        "player_id": "4431459",
                        "score": 100,
                        "sentence": "So, my six on is I have T.J. Hockenson at six, Sam Sam LePorta at seven, Tucker Tucker Kraft at eight, Tyler Warren at nine.",
                        "sentence_index": 620,
                        "status": "perfect match",
                        "transcript_name": "Tyler Warren"
                    },
                    {
                        "matched_name": "Tyler Warren",
                        "original sentence": "And I have Tyler Warren at nine.",
                        "player_id": "4431459",
                        "score": 100,
                        "sentence": "And I have Tyler Warren at nine.",
                        "sentence_index": 832,
                        "status": "perfect match",
                        "transcript_name": "Tyler Warren"
                    },
                    {
                        "matched_name": "Tyler Warren",
                        "original sentence": "I kind of felt that way about Tyler Warren.",
                        "player_id": "4431459",
                        "score": 100,
                        "sentence": "I kind of felt that way about Tyler Warren.",
                        "sentence_index": 874,
                        "status": "perfect match",
                        "transcript_name": "Tyler Warren"
                    },
                    {
                        "matched_name": "Tyler Warren",
                        "original sentence": "We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career.",
                        "player_id": "4431459",
                        "score": 100,
                        "sentence": "We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career.",
                        "sentence_index": 876,
                        "status": "perfect match",
                        "transcript_name": "Tyler Warren"
                    },
                    {
                        "matched_name": "Tyler Warren",
                        "original sentence": "All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often.",
                        "player_id": "4431459",
                        "score": 100,
                        "sentence": "All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often.",
                        "sentence_index": 878,
                        "status": "perfect match",
                        "transcript_name": "Tyler Warren"
                    },
                    {
                        "matched_name": "Tyler Warren",
                        "original sentence": "So, for me, I think Tyler Warren, just because of target share alone, how many catches he's going to get this year, is going to finish as a tight end one.",
                        "player_id": "4431459",
                        "score": 100,
                        "sentence": "So, for me, I think Tyler Warren, just because of target share alone, how many catches he's going to get this year, is going to finish as a tight end one.",
                        "sentence_index": 885,
                        "status": "perfect match",
                        "transcript_name": "Tyler Warren"
                    }
                ]
            },
            "Wilson Huber": {
                "mentioned_sentence_indexes": [
                    896
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Wilson Huber",
                        "original sentence": "Wilson and him.",
                        "player_id": "4239107",
                        "score": 100,
                        "sentence": "Wilson Huber and him.",
                        "sentence_index": 896,
                        "status": "best of multiple matches",
                        "transcript_name": "Wilson"
                    }
                ]
            },
            "Zach Ertz": {
                "mentioned_sentence_indexes": [
                    768,
                    674,
                    614,
                    617,
                    631,
                    632,
                    603,
                    607
                ],
                "occurrence_array": [
                    {
                        "matched_name": "Zach Ertz",
                        "original sentence": "Not a bad I had Zach Ertz written in.",
                        "player_id": "15835",
                        "score": 100,
                        "sentence": "Not a bad I had Zach Ertz written in.",
                        "sentence_index": 603,
                        "status": "perfect match",
                        "transcript_name": "Zach Ertz"
                    },
                    {
                        "matched_name": "Zach Ertz",
                        "original sentence": "But I had Zach Ertz written in.",
                        "player_id": "15835",
                        "score": 100,
                        "sentence": "But I had Zach Ertz written in.",
                        "sentence_index": 607,
                        "status": "perfect match",
                        "transcript_name": "Zach Ertz"
                    },
                    {
                        "matched_name": "Zach Ertz",
                        "original sentence": "If it wasn't for Debo Samuel, Zach Ertz would have been higher.",
                        "player_id": "15835",
                        "score": 100,
                        "sentence": "If it wasn't for Debo Samuel, Zach Ertz would have been higher.",
                        "sentence_index": 614,
                        "status": "perfect match",
                        "transcript_name": "Zach Ertz"
                    },
                    {
                        "matched_name": "Zach Ertz",
                        "original sentence": "I think I think where Zach Ertz gets there is.",
                        "player_id": "15835",
                        "score": 100,
                        "sentence": "I think I think where Zach Ertz gets there is.",
                        "sentence_index": 617,
                        "status": "perfect match",
                        "transcript_name": "Zach Ertz"
                    },
                    {
                        "matched_name": "Zach Ertz",
                        "original sentence": "So, obviously all our outliers, Matt, Zach Ertz, go ahead.",
                        "player_id": "15835",
                        "score": 100,
                        "sentence": "So, obviously all our outliers, Matt, Zach Ertz, go ahead.",
                        "sentence_index": 631,
                        "status": "perfect match",
                        "transcript_name": "Zach Ertz"
                    },
                    {
                        "matched_name": "Zach Ertz",
                        "original sentence": "You want to talk about Zach Ertz real quick?",
                        "player_id": "15835",
                        "score": 100,
                        "sentence": "You want to talk about Zach Ertz real quick?",
                        "sentence_index": 632,
                        "status": "perfect match",
                        "transcript_name": "Zach Ertz"
                    },
                    {
                        "matched_name": "Zach Ertz",
                        "original sentence": "Zach Ertz was another guy getting in there.",
                        "player_id": "15835",
                        "score": 100,
                        "sentence": "Zach Ertz was another guy getting in there.",
                        "sentence_index": 674,
                        "status": "perfect match",
                        "transcript_name": "Zach Ertz"
                    },
                    {
                        "matched_name": "Zach Ertz",
                        "original sentence": "It's like or Zach Ertz, you know what I mean?",
                        "player_id": "15835",
                        "score": 100,
                        "sentence": "It's like or Zach Ertz, you know what I mean?",
                        "sentence_index": 768,
                        "status": "perfect match",
                        "transcript_name": "Zach Ertz"
                    }
                ]
            }
        }
        const stripped_sentences = [
            "Ready, set, hood.",
            "Welcome to the Dynasty Nerds Fantasy Football Podcast, where we discuss Dynasty Strategy, rankings, and all things NFL.",
            "So, get ready to geek out on fantasy football with your host, Rich Dodson, and welcome to Dinosaur Fantasy Football Podcast.",
            "I'm Rich Dodson.",
            "He's Matt O'Hara.",
            "Hey.",
            "Hey.",
            "He's G Price.",
            "How's it going?",
            "And we're back to cover up the loose ends with the tight ends.",
            "That's right.",
            "We're talking top 12 tight ends.",
            "Not dynasty tight ends, but like how we think they're going to finish in the 2025 season.",
            "And you know, we all know the top guys.",
            "We all know how it's probably I feel like our top tier is going to be pretty similar.",
            "Um, no surprise, but we I'd be shocked if our top three guys weren't the same.",
            "The same three.",
            "I would be very surprised as well.",
            "Maybe maybe slightly different order, but maybe slightly different order.",
            "We're going to find out her soon.",
            "Um, and you know the key is like can we find out like who's going to finish as tight end four through seven and that's like the difference maker between your league mates, right?",
            "Because we already know the top three guys are going to give you an edge like nobody else has.",
            "But if you can have a guy that's like finished four through seven and is a little bit closer to tight end three, then you have now an edge over your rest lemates because once you get a tight end eight through 16, almost like wide receiver nine through wide receiver 15 on a points per game basis are pretty similar.",
            "So, before we dive in here, uh, this is literally the last chance you're going to have until kickoff next week.",
            "I think we can probably promote this next week's shows as well.",
            "Promo code nerds 30.",
            "What does it give you?",
            "It gives you 30% off of the Nerd Herd.",
            "That's right, the Nerd Herd 30% off.",
            "It's a big massive discount we're giving to get everybody ready for the 2025 season and belong and and beyond.",
            "Because in Dynasty, when I say the season's upon us, it isn't just the NFL and fantasy season.",
            "This is the start of the 2025 season for us.",
            "I mean, essentially, it really started back in January essentially because that's when we started doing the rookie prospects to get ready for this season, but to get ready for the 2026 season as well.",
            "This is where Dynasters is also going to help you.",
            "We're going to have the inseason tools to help you.",
            "Right now we have um the lineup optimizer in the Dynasty GM and our lineup optimizer, not to brag or anything, did better than Yahoo, did better than ESPN, and did better than Sleeper on our projections.",
            "They all um they're they're the lineup optimizer suggestions were better than everybody else's.",
            "So, what that what the app's going to do, it's going to go in there, it's going to read your starting lineup for you and tell you what changes you should make.",
            "And last year, it was right way more than it was wrong.",
            "some cool little things that you never think of too, like getting getting the uh um the best player into your flex and all that kind of stuff.",
            "Yeah, absolutely.",
            "That's right.",
            "It doesn't our app doesn't tell you Yeah.",
            "like, \"Oh, switch this receiver to this receiver.\"",
            "It say, \"Hey, move this receiver to your flex and then move this receiver in your wide receiver three.\"",
            "I didn't even think about so I forgot it does that because one of because when they play and things like that.",
            "Yep.",
            "So that's that's an inseason tool like a reddraft tool that the Dynasty GM does for you.",
            "It gives you access to to mock drafts.",
            "gives you the league analyzer, your player shares, the trade browser, which is going to show you real trades in real time made throughout thousands and thousands of fantasy leagues that are real trades and dynasty trades that so much more.",
            "And then when you get to the offseason, Dynasty Nerds Film Room, the nerd score, the extra content, the extra podcast, all for 30% off.",
            "Use the promo code Nerd 30.",
            "It'll be the best investment you ever make for your Dynasty team.",
            "So Nerds30, get in.",
            "It expires at kickoff next Thursday when the Eagles are playing.",
            "Who the Eagles play?",
            "Cowboys.",
            "The Cowboys.",
            "How about that?",
            "Great start to the season.",
            "Love it.",
            "Huge opener, right?",
            "Oh, I can't wait.",
            "It's going to be gaping.",
            "Anyways, so be gaping.",
            "Top 12 tight ends.",
            "Garrett, you have been a salty about this.",
            "Like you're on a paddle board in the ocean because you like it.",
            "Gargle gargle.",
            "Where are we uh approaching the tight ends?",
            "Let's uh let's go three at a time.",
            "Let's go three at a time this time.",
            "I feel like that makes more sense.",
            "Okay.",
            "In order in order how I think they finish top three.",
            "Yep.",
            "Which is again either way, but you could mix them up, but I I do have a preference.",
            "I really wanted to put George KD as my tight end.",
            "I wanted to I didn't, but I I wanted to, but then I was like, dude, Jacobe Myers is always being already being whiny about his time over there.",
            "Like, dude, Brock Bowers is again all the targets.",
            "Number one, all the targets.",
            "So, Brock Bower, he was tight end one last year, but on points per game basis, George KD was tight end one.",
            "True.",
            "Just mind you that.",
            "So Brock Bowers one, George KD two, Trey McBride three.",
            "I just I went chalky chalk.",
            "I went Brock B Trey McBride McBride then KD same as last year's um finish.",
            "But I mean, you know, it's it is what it is.",
            "These guys, you can't go wrong with either one of these.",
            "I ended up going Bower's KD McBride is on the same page.",
            "Yeah, we're on the same page.",
            "Here's here's my one beef with this right now.",
            "Where's the beef?",
            "Uh because I just did a a a friendly reddraft league the other day and I was looking at how all these things Did you destroy everyone?",
            "Of course.",
            "And it wasn't it wasn't friendly.",
            "Yeah, it was less than cordial.",
            "Uh but I was looking at the ADP of where these guys were going and it shows it right here as well.",
            "Brock Bowers goes off the board at 17.",
            "Yeah, understandable.",
            "Sure.",
            "Trey McBride 27.",
            "Uhhuh.",
            "10 picks later, George KD 38.",
            "So even though he's the third tight end off the board, way later.",
            "That's the value.",
            "100%.",
            "That's the value.",
            "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go.",
            "Trey Mc Bry goes like real quick after and I make sure I get George KD because that is where the value is.",
            "instead of taking Brock Bowowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George KD.",
            "Let me ask you this, though.",
            "You're sitting there at the last pick of the draft.",
            "What do you do?",
            "Because you get two picks there and then you don't pick until 36.",
            "What if somebody scoops you and then you're out?",
            "Then then I go to my my strategy B, okay, which is just suck and be mean tight end.",
            "Okay.",
            "No, there's two or three tight ends towards the end that I really like.",
            "I have a very bold strategy for a guy who's my tight end for by the way.",
            "I wonder if we have the same guy.",
            "Is he a local yokal?",
            "He is.",
            "He is.",
            "Me, too.",
            "Yeah.",
            "The same strategy.",
            "We've been talking about him a lot, so it doesn't surprise me.",
            "Yeah.",
            "So, like if I miss out on George KD to end round three, I have a very clear-cut draw who a guy who won't even go as tight end four because Sam Laapora is going to usually go tight end four there.",
            "Hinson, but like I have a guy that is I am zeroed in on that I think will finish um in that tier.",
            "And I' I've said on our uh nerd herd show like has a chance if there's one tight end that could break the mold of these three guys.",
            "This is the guy who I believe it is and it's my tight end four, David and Jooku.",
            "Okay.",
            "That I mean yeah.",
            "Do you also have him as I have him as tight end four as well.",
            "I have got him at tight end five I'm sure for very similar reasons.",
            "Um and this this I literally did a video like two months ago of like the the the surprise players that could finish number one overall and and David and Jooku was my guy for that.",
            "The easiest thing to do is just look at what he did with Joe Flacco before.",
            "That's it, man.",
            "That's the easiest thing to do.",
            "Those two guys are like peanut butter and jelly.",
            "Yeah.",
            "Did you see all the videos of them in golf carts together having a good time?",
            "Like, dude, he's going to be force-fed targets.",
            "Like, it I like Judy as well.",
            "Yeah.",
            "But the the guy to own for me in this offense, if I have to pick one, is absolutely David 100%.",
            "That's I'm a little bit lower on Judy than probably like I think than Rich because I think it's going to be the Injoku show.",
            "Y it's going to be they're going to be running the heck out of the ball.",
            "I haven't seen the type of connection.",
            "You know, obviously we only saw one preseason kind of series with those two guys on the field and it was a a misfire on the target.",
            "Um as far as uh Judy and and Flaco, but I I think I think Injoku and him have proven over time that you know obviously they have a really really strong connection.",
            "And even any quarterback not named Deshun Watson to start and finish a game last year, he averaged over 15 points a game.",
            "Yeah.",
            "So, he's still putting up borderline number one overall tight end numbers just with any random quarterback last year.",
            "Jameus Winston, uh, Thomas, uh, I even forget his name now.",
            "Thompson Robinson, Dorian Thompson Robinson, the worst quarterback I've ever seen play in.",
            "Yeah, terrible.",
            "Uh, like it didn't didn't matter who it was.",
            "He produced.",
            "He produced.",
            "So, you have that and you get Joe Flaccco back.",
            "Like I I think he's a smash value because his ADP right now in reddraft is tight end ninth off the board and he's going in the 80s overall.",
            "So in your traditional 10-man league that's eighth round like you're getting him in the eighth round.",
            "So I think that's just crazy good value.",
            "It's why I'm willing to gamble on the KD because if I miss out I'm totally comfortable getting in Jooku.",
            "He mentioned and in total last year he averaged I think about 13 point 13 13.5 points per game in PPR leagues.",
            "He missed five games last year, still finishes tight end 10 uh overall.",
            "And I I like Injoku.",
            "Obviously, we're all gushing about him right now.",
            "Do you guys have any concern that hey, they got rid of Kenny Kenny Picket?",
            "If something happens, they lose a few games, they're going to start turning to these rookies and then who the hell knows what we got out of a guy like Injoku.",
            "No, I think Garrett, like even mentioned, like the way he's the fact he was able to produce even all the other turds back then.",
            "I think Dylan Gabriel's a better quarterback than all those guys.",
            "And I I still think Andoku fits the mold of what we're looking for for the guys that have the chance to break in here.",
            "It's a guy who's gonna be the number two target in their offense.",
            "It's only you be the first or second target in their offense.",
            "Obviously, uh you have Brock Bower is number one target.",
            "Trey McBride, you can argue is number one target with Kyler Murray in that offense.",
            "George KD, if he's not number one, he's 1B, right?",
            "I think the same thing in Jooku falls into the same line as if he's not 1A, he is 1B.",
            "So that's what's going to propel him.",
            "I mean last year he saw the third most targets per game uh close to nine as it was.",
            "So I think with the quarterback play he's a get from Joe Flacco.",
            "We mentioned reported he's already got those guys are like two piece in the pod like you mentioned.",
            "This is a player who's gotten better every single year of his career.",
            "He's entering a contract year as well and he's entering 28 which is a prime year for tight ends.",
            "So he is just ready to take another step forward.",
            "First a question a and then I'm gonna go to one.",
            "Uh um a Dylan Gabriel obviously kind of earned the backup role there after this last performance um in everyone's eyes here.",
            "He can operate this offense.",
            "I I think personally there probably wouldn't be I mean there's going to be a drop off from Joe Flacco to anybody else on the roster, but I think he can operate the offense and and kind of support a guy like David Jok.",
            "So, I feel good about him being there and kind of being the number two guy.",
            "And number number one, uh, I can't remember what the other question was.",
            "Just let's move on.",
            "I threw myself off with the A in one.",
            "I think if you bring in a guy like Dylan Gabriel, they're going to try and keep things short and sweet for him to start, right?",
            "Like a lot of quick things like in the flat over the I remembered one.",
            "Harold Fannon looked good in this past few seasons and and with Injoku coming into a contract year, is there any thought that he chips away and and starts kind of getting a bigger piece of that pie?",
            "I think they're such different players that if they if he does start to see more snaps, it's because they're running two or two tight end likely.",
            "He's getting Isa like I think that's the case.",
            "I don't think it's at the expense of David and Jooku.",
            "And they even talked about uh I think it was the tight end's coach that came out and said like, \"Yes, they're both tight ends, but they are extremely different players in the way that they play the game, and we want to utilize both of those skill sets.",
            "They're gonna listen, the Browns are going to run a lot of 12 personnel regardless.\"",
            "So, yeah.",
            "So, I have David and Jooku at four.",
            "Um Garrett, you have him at four.",
            "Matt, you said I had him at five.",
            "So, who do you have at four?",
            "I got the Joker, man.",
            "Evan Ingram.",
            "That's what I have at five.",
            "Yeah.",
            "So, I think I think all of us have him at five, too.",
            "I don't have him at five.",
            "I I wanted to get him there.",
            "I have him at eight.",
            "So, I have him a little bit lower.",
            "All right.",
            "Okay.",
            "But you have him at four, right?",
            "I have I'm at four.",
            "And obviously, it's on the back of, you know, all the talk this whole offseason about Tron Peyton wanting to get a Joker and then him going out and kind of finding his guy, going out and saying, \"Hey, this is this is the guy that I want.\"",
            "Him and R.J. Harvey, which I think R.J. Harvey is going to have a role this year.",
            "I don't know that it's going to be as the Joker yet.",
            "You know, I think that's kind of one of those things that he'll have to grow into if he if he does become the long term.",
            "And RJ Harvey's not even going to play on third downs.",
            "Like, you know, it's Yeah, it sounds like his pass blocking is a big concern at this point.",
            "So, he'll really need to grow in order to become that kind of guy.",
            "JK Dobbins is reported he's the starter.",
            "Okay.",
            "As it's reported right now.",
            "All right.",
            "So, I mean, we all know that, you know, JK Dobbins is a talented guy.",
            "Can can catch some passes.",
            "I don't think he falls into the Joker kind of role as much as he is kind of just like an every down type of guy at this point in his career after all the injuries.",
            "So Evan Ingram is left, you know, as the guy that they're going to kind of use as this moving chest piece.",
            "And I think Shawn Peyton has proven in the past that he he really likes to target the tight end and really likes to get those guys involved.",
            "So that's why I got him at number four.",
            "For what it's worth, I I kind of have a tier for me.",
            "David and Jooku is kind of in his own tier after George KD and then five through nine are who's the last guy left like whoever is has the lowest ADP the guy that's available then I'll take them if I don't if I'm not able to get five through seven.",
            "So, I mean I mean I don't have I can't find Evan Ingram right here, but we're like one year removed from him being bananas and I could",
            "and",
            "that's why that's why I was gonna go off of Matt like so when you look at tight Evan Ingram what he can do when the target shares there and I'm agree with you.",
            "I think he does play that joker role.",
            "I think Shawn Payne does utilize him.",
            "I think he fits the mold of being the number one or the number two target in this offense and when he did that in Jacksonville we really saw him excel in 2022.",
            "43 targets 114 catches.",
            "Crazy amount of targets in 2022.",
            "He ended up being tight end five in PPR.",
            "And then when he got more acclimated in that offense, we saw more targets.",
            "He in 2023, he was tight end two overall in PPR.",
            "So, this is a tight end that we can that we've seen do it when the target share is there.",
            "I know last year he's seen about five uh receptions per game.",
            "I could see that go up to about about eight like like eight per game.",
            "So, for me, I'm with you.",
            "It's why I have him at five.",
            "I I couldn't get ahead of Enjoku because Enjoku's to me is a little bit more clear-cut.",
            "We want to see Evan Ingram in that role and I do predict him to be there but it's not 100% for me and with addition of having Courtland Sun.",
            "I think if if I knew that Flaco was going to be there and be the starter all year round all year, I would say for sure and David and Jooku over Evan Ingram.",
            "I just I think the path that the Browns are on in my opinion is hey we're going to start the year with Joe Flacco if things go south and they have a very hard schedule kind of upfront.",
            "Yeah.",
            "If this thing starts going off the rails we have to do our best to see what we have in this third round pick this fifth round pick.",
            "So next year we have the most informed decision possible.",
            "Do we need to go out and make a move at quarterback?",
            "And I think that is I think especially with with the trading away of Kenny Picket that signals that that path even more to me.",
            "I I've said that for a while now.",
            "I think um I think this schedule starts so tough you can't throw a rookie quarterback in there.",
            "You will just break them.",
            "I think Flacco does I think you're giving Flaco the start all the way through the London game which is the Vikings.",
            "Okay.",
            "Which I think is week six I think somewhere around there.",
            "I'll be there.",
            "Um I think after that if we're like one and five, two and four.",
            "Um maybe they're two and four like we've been played close games.",
            "They give another week maybe it gets to the buy which I think is two weeks later.",
            "But I think the Vikings game is where like that's where we're going to start to pivot.",
            "And then you're right.",
            "I think they're going to want to see what they have in Dylan Gabriel because like if they they spend a third round pick on him.",
            "I I've been kind of hammering this all along, right?",
            "Like everybody's been I've been saying on the show like during rookie stuff like people are drafting Shadur Sanders way ahead of Dylan Gabriel but like the Browns love Dylan Gabriel and they've done that throughout camp they've done it through um this point they just named today Dylan Gabriel the number two quarterback.",
            "I mean I said it when they drafted him that dude can run the offense right now and he looks like he can run the offense right now.",
            "He looks good.",
            "I mean he for somebody who I didn't over love say he looked good in this offense.",
            "He doesn't push the ball down the field as much as you'd like, but I he knows how to hit that back foot and find a guy and he processes well and gets the ball out quickly.",
            "And that being said, I still think the Browns starting quarterback is playing college football this year and they're going to use they Browns have acquired a lot of draft capital for 2026.",
            "10 picks next year.",
            "Yeah.",
            "And two for like they're going to go get a quarterback.",
            "It's a quarterback heavy class.",
            "So, yeah.",
            "So, we'll see.",
            "Um Evan Ingram, I have him at five.",
            "Um, you have him, you have him and Jookus flip-flopped, right?",
            "So, Garrett, who is your five?",
            "So, my five, I actually went back to Old Faithful.",
            "Uh, I put Travis Kelce there.",
            "Uh, I think the thoughts of his demise were overblown last year.",
            "He was tight end five last year.",
            "Like, he was still a very good athlet.",
            "Yes, he wasn't the elite blue chip guy that he used to be, the the standalone guy.",
            "Still a very good guy.",
            "And it looks like we are going to be getting some mime time from Rasheed Rice.",
            "So with that, I think he's still going to have enough volume and I think he's going to be good enough to still be right in that range.",
            "I'm at six.",
            "So I'm I'm with you.",
            "Can I get some credit here?",
            "Um I said on this podcast a month ago, I think I broke into the world that he was about the engagement.",
            "He's going to be engaged.",
            "So he got engaged today, but I did I not say this podcast a month ago.",
            "My birdie had told me that Travis and Taylor would be getting engaged soon.",
            "Yeah, you did say that.",
            "Did I not say that?",
            "And here we are just a month later in Aaron engage.",
            "So tech I mean I was the one breaking news.",
            "I was the one that not breaking news.",
            "I had I had inside info on that just by the way.",
            "Um but yeah you have we are the official Taylor Swift podcast obviously.",
            "Come on join my podcast.",
            "Taylor I to be honest with you everything I've heard about her is like first of all my wife wanted to watch that podcast when she was on New Heights.",
            "I thought she came out absolutely fantastic.",
            "She looked fantastic on there.",
            "Again, I have I know somebody who's best friend.",
            "Yeah.",
            "Like, so like everything I have heard about her is that she is awesome.",
            "She's the most down to earth per person.",
            "She jokes around, has a good time, knows how to give good time.",
            "You would never know like by just hanging out with her like she's one of the biggest stars in the world.",
            "So like I and that my wife is like, \"Oh, I really enjoy that.",
            "She came off really well.\"",
            "I was like, \"Yeah, she came off exactly how I heard she is.\"",
            "Like she's really just a great person.",
            "So I mean that's great to hear because that could go, you know, all sorts of crazy ways when you're making that kind of money.",
            "So of course, you know, if you're the biggest star in the world, what are you going to",
            "You're gonna marry a Cleveland boy.",
            "Adele did the same thing.",
            "So, come on.",
            "Get hip.",
            "Get hip out there.",
            "Us people from Cleveland are just, you know, just slightly better.",
            "Slightly better.",
            "I mean, got bone thugs in harmony.",
            "You can't you can't mess with that.",
            "Yeah.",
            "So, um you have Travis Kelce at five.",
            "I actually have not at 10.",
            "Okay.",
            "Um it's you we saw last year like he he approached uh uh career lows in what like his touchdowns, his yards after the catch, um his yards per route run, his total receiving yards.",
            "And what concerns me still 823 yards now.",
            "Say his lows are still really good.",
            "And listen, I get like like Garrett said, he still finished as tight end like five overall.",
            "So like he was still legit.",
            "My concern is now yes, he is a year older.",
            "It's it's the Rashid Rice because where Rashid Rice and he's he missed a lot of time last year.",
            "Where Rasheed Rice wins like he's not like a take the top off defense like he wins in the middle of field, right?",
            "Like the short crossing routes are his bread and butter.",
            "So, I think he takes away from Kelsey is what it is.",
            "So, I still have a tight end 10.",
            "If you finished higher, not surprised because like you said, my tight end from tight end eight down.",
            "Yeah.",
            "Whatever.",
            "You know, like I haven't finished, but like we're splitting we're spinning micro hairs.",
            "Right.",
            "Right.",
            "So, for me, it's just I think the Rasheed Rice effect is what's going to take away from Kelsey just enough because it is so close.",
            "Just kind of we talked about before the light tight ends or the receivers.",
            "It's just so close.",
            "Any another slight down tick from his production like we saw last year where everything was down, right?",
            "Um it just moves him from tight end five to tight end 10 because it's it's that close on a point per game basis.",
            "Where do you have tight end uh Travis Kelce Matt?",
            "Six.",
            "Oh, so pretty high.",
            "So I'm the lowest.",
            "You're the lowest.",
            "Yeah, I already mentioned that.",
            "I am at six there.",
            "It's just so like",
            "So I had So who's your six then?",
            "Because we have our Oh, yeah.",
            "So you have I think my Evan Ingram was or no?",
            "Oh yeah, Evan Ingram four Jou five and then Travis G.",
            "So who did you have?",
            "I have TJ Hawinson at six.",
            "I have T.J. Hawinson at six as well.",
            "Okay.",
            "Where do you have Hawinson?",
            "Um 12.",
            "Oh wow.",
            "Way too low for me.",
            "Um why why why so low?",
            "Is it the nerves about JJ McCarthy first year or what what's what's causing that trepidation?",
            "I mean yeah.",
            "Um, no, I don't have a lot of con I don't have a lot of conviction about about TJ Hawinson here at 12.",
            "Um, he was tight end 12 on the year last year.",
            "Only only played 10 games.",
            "He he probably is probably a little bit low for me right now that we're discussing things and talking about him on a podcast uh and not writing them down, which is which is very very easy to do.",
            "Um, listen, I I do think obviously especially with what's his name um being Addison.",
            "Addison being uh gone suspended for a couple games.",
            "Was it three games?",
            "Four.",
            "Is it four?",
            "Yeah.",
            "Why?",
            "It's why I w I thought about putting Hockson higher.",
            "For some reason, in my head, I only had it down as two.",
            "So, that's crazy.",
            "Well, you said three, I say four, you say two.",
            "I believe it's four.",
            "You You're probably correct.",
            "I I I didn't say that with a lot of conviction, but for some reason, in my mind, it was only two.",
            "Yeah.",
            "So, I mean, we could see we could obviously see Hawinson being much higher than where I have him.",
            "And and I think, you know, it was just more of a factor of getting other guys in above him and kind of at the end going, I need to get um T.J. Hawinson into this top 12.",
            "Where does he fit?",
            "Um and I I just felt really good about my other guys.",
            "So that's why Hawinson ended up 12.",
            "I think it's",
            "Yeah, it's three games.",
            "It's three games.",
            "Okay.",
            "So, who was right there?",
            "You.",
            "All right.",
            "Look at this guy.",
            "You mentioned, Matt, he was tight end 12 last year.",
            "Yeah.",
            "And that was He was on a points per game basis.",
            "On a points per game basis.",
            "And what's nice is like he missed a lot of time last year.",
            "He he didn't come in until week nine.",
            "He played in 10 games.",
            "Yeah.",
            "So he only played in 10 games.",
            "Uh come off the ACL and MCL surgery.",
            "So that's going to take a little bit time to come back from.",
            "And even when he came back, I mean he wasn't like overly fantastic.",
            "Um weeks nine through 17 though, which is where I have him, he was tight end 10 overall.",
            "Okay.",
            "So and and that was that wasn't anything.",
            "You know, the year before he had 95 catches, 960 yards.",
            "And the question is, you know, can he come back to where he was?",
            "And this is somebody when you look back at 2022 tight end two overall, 2023 tight end four overall.",
            "And I think he's extremely talented tight end who at one point had my dynasty tight end won overall because how much I loved him.",
            "I think that Jordan missing a couple games is enough to really propel him.",
            "Now that he's more than a full year removed from his injury, the fact that he's gonna be able to slide in as a number two target in this offense, um I think it'll kind of help propel him, build that rapport, JJ McCarthy, be again, we always talk about these rookie quarterbacks, like always one of their safety nets.",
            "It's usually the tight end.",
            "I think Hawinson kind of felt um find himself in that position.",
            "I think Kevin Okonnell could trust Hawinson enough to be JJ safety enough as well on top of having a guy like Justin Jefferson.",
            "So for me having tight end six and Garrett you as well I'm sure you feel the same way is he's just too talented for me um not to not to come up this high but like I said when I get to tight end 678 so my it goes to me it goes Hawinson Leaporta and Tucker Craft for me and I could easily see all three of those guys being tight end six tight end seven and honestly they finish as like tight end five you know like Hawinson's talented enough like he could finish as tight end four and it wouldn't he could outproduce injoku I'm with you.",
            "I have him in my own tier, but like if he finishes tight end five, um if Leaporta was tight end five, if Tucker Craft was tight end five, that does not shock me.",
            "So even though I have Hot Tockinson at six, I'm with you in the tier group.",
            "Five through like eight to me are pretty close.",
            "I like I almost want to put Evan Ingram in his own tier because I'm with you Matt like how I believe he's going to play that Joker role.",
            "Once I know that for sure, he's locked in there.",
            "And that's why I said like six through eight I feel more comfortable interchanging.",
            "But at the same time, those guys could easily jump up for me.",
            "So I do like you have Hawinson at six as well.",
            "I have Hawinson at six as well.",
            "And yeah, I echo a lot of the same things you do.",
            "It just comes down to the to the player himself.",
            "Um he is just such a talented player.",
            "This offense is just friendly for fantasy football points.",
            "Uh so I I I see him in a very positive light.",
            "Uh and then for me, I have at seven, I have Sam Laaporta.",
            "Yep.",
            "And then which is So do I. pretty low actually for well for ADP I'm saying uh overall ADP he's the fourth tight end off the board and when you look at Sam Laora he's the 51st guy off the board then",
            "when you get into a lot of the guys that we're talking about Evan Ingram David and Jooku Tucker Craft Evan Ingram's 80 and Jooku is 82",
            "Tucker Craft's 108 um so I mean he's significantly ahead of those guys so for me Sam Leaporta",
            "This is not a knock on him as a player.",
            "I think he's a very, very talented player.",
            "But once again, if this offense just takes a 5% step back, 10% step back.",
            "And then if Jameson Williams is actually more involved and takes some of that away, like there's just a lot of little things.",
            "They don't have to be huge things, just little things that could pull him back that could all go the wrong way, basically.",
            "And Leaporta was eight last year.",
            "Yeah.",
            "Tighten eight.",
            "So, I mean, I came on a show six months ago and I brought this up and I said, \"Man, one of my biggest sells right now and tight end premium or in fantasy right now is Sam Laaporta.\"",
            "We talked about that a lot on roster rescue as well.",
            "And I said, this has nothing to do with Sam Laaporta.",
            "I think he's a super talented tight end.",
            "I was like, my point is he finishes tight end eight this year.",
            "I feel going forward Sam Laaporta, which is again a very solid asset to own, is gonna live in tight end six to eight range consistently.",
            "Um, and the reason why is I still have some my notes back here from early like six months ago and it says what happened to his targets per game.",
            "It went from seven to five.",
            "So he lost two targets per game because Jameson Williams took a big step up.",
            "What did we used to talk about with KD?",
            "It was like well KD can always he can perform if these other if one of these If one of these two other guys goes down, and it's a very similar thing argument you can make for Sam Laora.",
            "If he if one of those guys goes down and Sam Laora all of a sudden gets more of the target share because those naturally they're just out of the offense, then yeah, he can bump way the heck up.",
            "He's got the talent to do it.",
            "It's just there's only one football and there's only so many targets to go around per year.",
            "Yeah.",
            "And we saw Jameson Williams clearly establish himself as a number two target at offense.",
            "And we've made and that was my point about selling him too like hey man like he's now the number three target in that offense and you can't be an elite tight end if that's how you're going to operate.",
            "It's just not pos it's literally not possible for you to break that tier.",
            "So like my suggestion was like, \"Hey, move off of Leaporta for like even like a guy like in Jooku extender plus, right?",
            "Because you could probably get David and Jooku plus a first uh this year.\"",
            "And just imagine if you got you sold David Sam Laaporta for David and Jooku in like 111 and now you can sit there either with Sam Laaporta and like Caleb Johnson.",
            "Sam Sam or I'm sorry um David and Jook.",
            "Yeah, David and Jooku and Caleb Johnson, RJ Harvey, Colston Love, another tight end, a Jackson Dart.",
            "like and I feel much more comfortable with that combination because I'm with you Matt like as it's going to take another receiver to leave that for him to get into that situation and yes they picked up Jameson Williams fifthear option but with how good Isaac Tessa has looked in this offense they spent a third round pick on him there's nothing to believe that if for some reason Jameson Williams leaves that Tesla is not going to literally slide into that Jameson Williams role so those concerns for me is again it's just about value verse production and I love Sam Leaporta I really do I think He's an amazing talent.",
            "It just comes down to the situation.",
            "Exactly.",
            "I feel like Dvonte Smith, like I said last year, like I love Devonte Smith.",
            "I love his talent.",
            "It's just where the target shares where the opportunities, right?",
            "It's a that it all comes down to system and why we love again Alvin Kamaro so much because of the system he plays and how he plays.",
            "It's not as do the players.",
            "So, is there a path for Leapora to join those elite guys again?",
            "Definitely as like some of these other guys start to age out.",
            "100%.",
            "But as things stand now, Leaporta to me fits right where he finished last year.",
            "tight end seven, tight end eight.",
            "Like I'd almost rather chase the upside of a guy like Tucker Craft plus and I get a significant plus than having Sam Leaporta.",
            "Now, can I settle with Sam Leaport in Dynasty?",
            "Oh, I'm very happy to have him because if I have Titan 7, Titan 8, Tight end six, year in year out, like I feel very comfortable, but again, I'm trying to build the best roster possible to score the highest points, not settle, right?",
            "No, it makes perfect sense.",
            "Rich, why don't you tell us about our friends over at FFPC?",
            "Yeah, my FFPC.",
            "This is I  think Garrett said last show this is the last uh time we're promote them until the uh season comes back where we start talking orphans here and come January.",
            "Uh so this is your last chance to go out there and check them out.",
            "I don't even know if there isn't that much time to join a Dynasty League at this point.",
            "But go find out",
            ".",
            "But go check them out.",
            "Use the promo code Nerd get $25 off.",
            "And just to let everybody know what they stand for as we get ready for the season case time you're listening.",
            "If you can get in, great.",
            "If not, we'll have some good opportunities for you to join your orphans.",
            "is, you know, this is a place where you can go and play high stakes dynasty.",
            "You can join leagues up to $2,500.",
            "You can join leagues for $75.",
            "You can join standard, PPR, Superflex, try superflex.",
            "So many different options they give you.",
            "And what they the number one thing they offer you is security.",
            "This is a place where no league has ever folded, no matter what.",
            "So when you get in one of these leagues, you feel very comfortable about building for the future, blowing it up because you don't want to play in a thousand league, a $2,000 league, and you're like, \"This is it.",
            "I'm blowing everything up, and now I'm taking the da device.",
            "I have 827 first.",
            "I am going to dominate 2027.\"",
            "Um, and mind you, I saw a great tweet from Matt Miller, the ESPN draft analyst, uh, yesterday.",
            "It said, \"Man, if I play Dynasty, I'd be loading up on 27 picks.",
            "That looks like a one of a kind, dude.",
            "I've been telling people.\"",
            "And I was like, \"Dude, Matt, Matt, we are Dynasty experts.",
            "We've been saying this for nine months.",
            "So, welcome to the club, buddy.\"",
            "And you're NFL draft analyst.",
            "Anyways, my FFPC if that league folds all of a sudden because like too many people bounce because nobody has their first like you just spent 2,000 $4,000 for literally nothing, right?",
            "Like there's no fun in that.",
            "So, check them out.",
            "My fpc.com promo code nerds.",
            "Yeah.",
            "And fast draft, man.",
            "Things are just getting going here.",
            "You can enter that rabbit tournament and I've I have a lot of entries in it.",
            "To be honest, I've thoroughly enjoyed uh the product there at Fast Draft.",
            "You you can use promo code nerds.",
            "They're going to match that deposit.",
            "If it's 10 bucks, now it's 20.",
            "If it's 50 bucks, now it's $100.",
            "They'll match it all the way up to $50.",
            "So, head over there, Fast Draft.",
            "Use promo code nerds.",
            "Best of all, you're also going to get a free year of everything we do.",
            "Extra podcast, GM tool, film room, everything.",
            "everything we do, you can get an absolute free year.",
            "It's It's the best offer in Dynasty right now.",
            "So, use promo code nerds at fastdraft, win a bunch of money there, and get free stuff from us.",
            "Hell yeah.",
            "So, Matt, how about you just um we went through six, right, for you?",
            "",
            "Yep.",
            "I went I went 678.",
            "Uh before we give because I know we're gonna talk about Tucker Craft.",
            "You went to six.",
            "I I I did mention my 67.",
            "How about this?",
            "How about you give me six through 12?",
            "Okay.",
            "and then we'll all go through our sixth through 12 and then we'll kind of go into some of these guys.",
            "Can we do seven through 12 or six?",
            "Do you want six through 12?",
            "Just remind a little recap on that.",
            "We're not going to talk about the six player but just kind of so six through 12 TJ Hawinson then Sam Leaporta, Evan Ingram, Tucker Craft at nine.",
            "At 10 I have Mark Andrews.",
            "At 11 I have Hunter Henry.",
            "And at 12 I have Kyle Pittz.",
            "I thought about getting Hunter Henry in there.",
            "I you know it's a weird it's a weird range down there and I was like it is very weird and I went a little weird there too.",
            "Did you I was like right at that same who's Mr. like steady that like oh he's tight end 12 again like it could easily be love at 12 but anyways who's your sixth through 12.",
            "All right 6 through 12 I went uh Travis Kelce Sam Leaporta at seven at eight I went Colston Loveland.",
            "Whoa.",
            "Yeah.",
            "We were talking ADP wise like who's the highest on Loveland?",
            "Matt was way higher.",
            "I was like I told you you loved him.",
            "I love him.",
            "I was like, uh, number nine, Tucker Craft.",
            "Now, now we see why George KD is below him in our in our GM tool.",
            "That might just be a function of We'll talk about that later.",
            "Um, Mark 10 10 Mark Andrews, 11 Zack Z.",
            "That's where I went a little crazy.",
            "Not a bad I had Zack Z written in.",
            "Yeah.",
            "And I had to take him out for my 11 guy because there's no way I was not going to put my 12th guy in.",
            "Um, I know who that is.",
            "But I had Zack Z written in.",
            "Okay.",
            "All right.",
            "So, to be fair, your 12th guy is my 13th.",
            "So, I I almost got him in.",
            "Um, so did I.",
            "I wanted to.",
            "If it wasn't for Debo Samuel, Zacks would have been higher.",
            "That That's been on my mind.",
            "But I I I still think the Debo I I still think I still think he gets enough.",
            "I think I think where Zack Z gets there is.",
            "It's not on the amount of catches and yards he gets.",
            "I think it's the touchdowns is what I think he's I think you see double digit touchdowns this year.",
            "So, my six on is I have T.J. Hawinson at six, Sam Leaporta at seven, Tucker Craft at eight, Tyler War at nine.",
            "Okay.",
            "Uh Travis Kelce at 10.",
            "So, we just picked a different rookie tight end together.",
            "Mark Andrews at 11.",
            "And I have Dolan Concade at 12.",
            "Makes sense.",
            "Yeah.",
            "So, wait, who' you say was 11?",
            "Uh Mark Andrews.",
            "Okay.",
            "So, obviously all our outliers, Matt, Zack Z, go ahead.",
            "You want to talk about Zack Z real quick?",
            "I mean, I we we basically touched on it.",
            "I just I I I think this is a great offense.",
            "Obviously, year two with um Jaden Daniels, I think the whole offense is going to be better and humming and obviously they they got uh Terry in which is I think great news just for this whole kind of thing going on and you know they're they're they brought in Z I think as a guy that they felt familiar with and they drafted Sonat last year.",
            "really hasn't come together for Ben um yet and had a rough camper I heard rather yeah even even in camp hasn't been great so I think that's going to make them kind of rely on Z even more John Bates is a fine tight end he's just not going to be a factor in the pass catching realm and Z had a really good kick right and Z has looked great so um I think you know last year he was at tight end seven and this is actually a step back you know what I mean getting him in at tight end 11 just because I think there is going to be some sort of negative effect with with Debo being there I just don't think it's I think it can be offset by things like like like touchdowns.",
            "Um so I don't think he's going to get to the 91 targets that he had last year, but it was 91 targets, 66 receptions, so he could be more efficient with less targets and still kind of be in that same catch range.",
            "And you know, maybe maybe a slight drop off in in um uh yardage, but from what I had reports on camp is like they really were utilizing ZS a ton in the red zone.",
            "And and everything I read like he was just dominating every rep in there.",
            "So he's a very savvy tight end.",
            "Obviously going to be one of the older tight end producers that we've ever seen.",
            "If he does do that, I think it's 35. 35 or 36. 34.",
            "Okay.",
            "Okay.",
            "So he's going to be 35.",
            "So Garrett, who was your outlier?",
            "My weird one was uh Hunter Henry.",
            "Hunter Henry.",
            "Uh here here's the biggest reason.",
            "total targets at the tight end position.",
            "He was fifth last year, fifth in targets.",
            "If he's going to be getting that kind of volume in this offense, which it could maybe trickle down a little bit.",
            "Uh we do have Stefon Diggs there.",
            "We we do have Kyle Williams there now.",
            "So, it could drop a little bit, but I don't think it's going to drop significantly.",
            "I still think he's going to be inside the top eight or so at on targets.",
            "And I think they're going to be better targets this year.",
            "and and Hunter Henry even missed the game.",
            "So, it wasn't even like he he played every game.",
            "Uh but he was still there.",
            "97 targets last year for Hunter Henry.",
            "Very very solid number.",
            "And he's just the most unsexy guy to do it.",
            "But if if something goes wonky in my my reddraft leagues or even in my dynasty leagues and I just don't have a tight end, he's the easy like break glass in case of emergency guy because I know he's going to get me eight to nine points a game and twothirds probably get it done.",
            "You know, if not a third, a third and fourth would get done for Henry.",
            "And and you're right, like I He's another guy I really want to get in.",
            "And you're right, man.",
            "It got real wonky to back here because there's so many guys I wanted to get in, right?",
            "I I found a path for John Smith with paired back up with Arthur Smith to be the clear number two option in Pittsburgh.",
            "I think there's a chance for him to be Ferguson.",
            "I'm spread knowing how to hit him.",
            "Jake Ferguson has a chance like all those guys are all sitting there.",
            "Hunter Henry, I was like, dude, a very clear path for him to be the number two target there.",
            "Zack Z was another guy getting in there.",
            "I settle Dan Concade.",
            "I think it's pretty clear and obvious this is a player, former first round pick, enters year three year.",
            "This is going to be his make or break year.",
            "This is by all reports even out of like outside of the scout I talked to saying hey they want to make sure this offense is run through like don't look conc just comes down to can he stay healthy can he get separation for me and for me I think coming in this offense that's going to be you know a dominant offense out there they have no clear cut wide receiver one on this offense",
            "yes it's because they paid clear Shakir they didn't even pay him wide receiver one number they paid him wide receiver two to money and that's what Cleo Shakare really wins.",
            "So like does Keon Coleman step up in as the number one weapon in this offense or is it Dinc Concaid?",
            "I'm gonna put my money on Daltton Concaid in that manner and because if it is Khalil Shakir then we're just looking at lackluster passing game as it is as they spread around.",
            "I think for me even though he's tight end 26 last year um I think he has a chance to slide into that number one target role.",
            "So yes, am I being biased here?",
            "Am I speaking out of love?",
            "Yes.",
            "And I'm gonna stick with my evaluation that I saw on tape.",
            "And, you know, I knew this was a player that, you know, had a chance to take some time.",
            "This is a guy who didn't really play football at all in high school.",
            "Like, he moved out, then he played Jo, went up to Utah, and then he was in the NFL.",
            "Like, he only has like going to this year, he's honestly, he's only been playing football for like six years.",
            "So, for me, having that draft pedigree, them want to prove that they're right in their in their assumption on him.",
            "I think he has a chance to take a step forward.",
            "Um hopefully it's higher than 12, but like I feel like this is the range he could possibly live in.",
            "I think there's a lot of upside there.",
            "Uh but right now I'm going to be a little uh bearish on him even though I love him.",
            "So he's my outlier.",
            "I think everything else like we all had Mark Andrews in there.",
            "I think the only one that I didn't hear you guys say that I did have was Kyle Pitts.",
            "Did you Nobody had Kyle Pitts in there?",
            "I did not have.",
            "So yeah.",
            "So this is maybe not quite the same love, but Kyle Pittz is a player that Yes.",
            "He's been severely severely disappointing uh over over the course of the past three seasons, but we have a we have a new new sheriff in town.",
            "We got a new quarterback in here.",
            "Um granted, it's what they should say, but all signs point to them saying like, \"No, we must get Kyle Pittz the football.\"",
            "Like, this is this is a must.",
            "He's the number two option in this offense.",
            "I mean, it is it's Drake London to be Well, right.",
            "I'm sorry.",
            "besides Bejan, who is actually the number two.",
            "Um, but like down like a downfield, but young guys tend to not check it down as much.",
            "They tend to take more chances downfield.",
            "I I'll tell you this.",
            "I have no idea.",
            "I would say there's almost a 0% chance, which is low.",
            "Did they pick up his fifth year option?",
            "Oh, they're not picking that option.",
            "Yeah, because where he was drafted, it's too much money.",
            "Didn't they already have to make that decision?",
            "Did they get open to Google?",
            "get up on the Google because after year three they have to make that decision.",
            "Oh, really?",
            "If they did, that's crazy because he was a top 10 pick, so they had to pay him top 10 pick fifth year option money, which is crazy on production.",
            "Yeah, I mean obviously he's besides his rookie year hasn't done anything that would indicate that you want the Atlanta Falcons picked up Kyle Pitt's fifth year contract option on April 29th.",
            "There's almost a 0% chance.",
            "Rich, there's a 0% chance already did it.",
            "So, that's how my mind works.",
            "I speak in facts.",
            "Uh I listen I'm like Matt just said besides Rick Gear he has done nothing.",
            "So as much as like he's only 25 he 100% can be be an alltime great tight end.",
            "Like no that remember that one wonky couple years he had those three years there uh in Atlanta.",
            "That one wonky threeear window.",
            "For what it's worth this is his fifth year.",
            "So this is his final year.",
            "Oh this is his fifth year.",
            "Oh yeah god.",
            "Time flies when you're talking dynasty.",
            "Um, well, it really does.",
            "It's insane.",
            "Isn't that crazy that it's already year five?",
            "So, he had the one great rookie season and then three duds.",
            "Yeah.",
            "So, for me, it's Arthur Smith, Arthur Smith, who whoever the heck's there now, I guess.",
            "I can't remember the cousin.",
            "Who's the who's the OC there now?",
            "Uh, some former Rams guy.",
            "Okay.",
            "There's so many all the like when we talk about all those bunch of guys in the bottom there like a guy in Zachary, it's Hunter Henry.",
            "I feel more comfortable about all them than Kyle Pittz.",
            "Like I just I'm I'm done until I see it and I don't believe it.",
            "Yeah, it's hard.",
            "But I'm not saying it's not in the realm of pass possibility.",
            "He's still again he's so young and he was so talent and he already did it at such a high level.",
            "He did in college at a high level so it's in there but something went sideways and it hasn't wr itself since his rookie year and you get to a certain point where like I don't know if it's even correctable.",
            "Now to be fair we saw a guy in the same exact mold, right?",
            "guy",
            "we already talked about, Ev",
            ".",
            "Evan Ingram came out, same gang busters.",
            "Same exact thing.",
            "Same exact thing and then fell off the face of the for the New York Giants.",
            "A first round pick, was amazing his year one, and then fell off the face until he got catch for two or three years.",
            "And for what it's worth, he was tight end 15 last year.",
            "So, it's not like he was crazy far away from the top 12, but it's still disappointing with where we expected and the value.",
            "Yeah.",
            "compared to ADP.",
            "And it's the thing what Kyle Pitts cost you compared to what you give Hunter Henry for.",
            "It's like or Zack Z, you know what I mean?",
            "It's like Exactly.",
            "And once you're in that range, like what am I paying?",
            "And like if you still have Kyle Pittz, you're not definitely you'd rather just hope and hold on and go down with the ship, right?",
            "Like I might take a second, honestly.",
            "I don't think I would.",
            "I think even though I'm the one like like proponent of him and I'm down on him, but I would still rather just like the the tight",
            "that",
            "position",
            "'s so elusive.",
            "and he's still so young.",
            "I would rather just gamble on the upside and like and then hope that like he doesn't work out in like Atlanta and he goes somewhere else and like just like Evan Ingram it was great, right?",
            "And he has so much time like dude he could be a dud for two more years and be as year 27 still have three or four guys.",
            "We've been wanting a guy to go here forever.",
            "What if he's finally the guy that joins Justin Herbert?",
            "Oh dude.",
            "Yeah.",
            "There.",
            "Or replaces Travis Kelce.",
            "You know what I mean?",
            "Solomon knows.",
            "I thought that's what you were going to say.",
            "We've been trying to play for years forever.",
            "Mike Casei, it's happening.",
            "No, dude.",
            "What?",
            "I was Yeah, what if he did get extended in Cincinnati though?",
            "He did.",
            "God bless.",
            "Hey, Nerd Herd.",
            "Want to tell you about a  show that we've been doing live on YouTube where we go over your teams and we talk about how to fix your broken roster.",
            "It's called Roster Rescue.",
            "We do it live every single Monday at noon Eastern time.",
            "And if you want to get a part of that, just head to our Dynasty Nerds homepage, go under the store tab, and you'll find roster rescue right there.",
            "Perfect opportunity to get your rosters in shape before the season or even in the middle of the season to make sure that you can win a championship.",
            "Mark Andrew's on our list.",
            "You know,  somebody who's taking a big dump down is it really had to do with likely news.",
            "Sure.",
            "Uh Harbaugh saying, \"Hey, we expect him to be like an allp pro.\"",
            "All signs that like literally they were trying to extend him.",
            "They get hurt real bad.",
            "Despite all that and despite that, Mark Andrews fell off like real hard early in the game.",
            "I think the first",
            "Now, you remember he he did have that pre uh season car accident.",
            "So, he was hurt going to the season.",
            "Uh well, he didn't really start coming on until I think it was like week five or six.",
            "Mark Andrews finished as tight end six overall last year.",
            "Like, he was still a very solid.",
            "All the dude does is produce, man.",
            "Yeah.",
            "So, I mean, we we all have them pretty low, right?",
            "I have him at 10.",
            "You had him where?",
            "I had him at 10.",
            "At 10 of them, exactly the 10.",
            "Yeah.",
            "And and last year if you you know he started the year so bad but from week five on he was tied in five like he he was he was really good and only a couple he only had two games under 10 points during that stretch too.",
            "So he was still fairly consistent but yeah he's he's a tough one because you feel like the other shoe is about to drop any time but it just hasn't and he's still he's still putting up numbers.",
            "All right let's talk two rookies then we'll finish it off with Tucker Craft talk.",
            "Sounds good.",
            "Okay.",
            "So, Matt, you have Coloulston Lovelin in at number nine.",
            "Eight.",
            "Eight.",
            "And I have Tyler Warren at nine.",
            "So, um I was telling Garrett on the uh fantasy roster rescue show like God, why is this KD thing off?",
            "And then he looked it up.",
            "He's like, \"Whoa, Matt's got Coloulston Lovelin so high.",
            "I think you have like 35th overall in Superflex Titan Premium Rinkets.\"",
            "I I I think that's something I just need to go in and correct and back.",
            "I think it's a a function of the way we copy and paste or copy over.",
            "I got I think it's just That makes sense.",
            "Okay.",
            "fix that.",
            "I will.",
            "I think I I think I",
            "So, he's not a top three round pick for you.",
            "No, I have to move him down specifically every single time.",
            "And I think I forgot I had to move I have to I have to go back in and move Brock Bowers down because when I don't it automatically moves him to my number one overall player.",
            "So, and I and it was just it was a it must have been like I I did an update, I forgot to just move him.",
            "Gotcha.",
            "Gotcha.",
            "That makes sense.",
            "So, you but you still haven't finished as tight end eight amongst such a crowded room of weapons here.",
            "DJ Moore, uh, Romo Dunay, the the staff has been raving about Luther Burton over the last two weeks.",
            "So, how does how does Colston Lovelin carve out a path in a 2025 season as a rookie tight end?",
            "Yeah.",
            "Yeah.",
            "I think, uh, you know, obviously this is a very crowded situation.",
            "Um, so that's going to be I think the biggest hurdle is to to get over is is to get the targets, but we've seen obviously rookies make a big impact in Ben Johnson's offense in the past.",
            "Sam Leaporta comes directly to mind his rookie year when he finished as I think tight end two or three.",
            "Um I can't remember it was he was tight end one at one point and I think I think he got passed in that year.",
            "Um so I'm not I'm not bl bumping him up that crazy high",
            "but",
            "this past he was actually tight end one but it was partly because a few guys missed a couple games and he didn't.",
            "So on a points per game basis he was tight end three overall.",
            "I knew there was something weird.",
            "He was he was up there really really high.",
            "Um obviously I think those numbers are going to be going to be hard to get to because there's just too many people to kind of target um in that offense, but we've we know they like to use them and I think they tipped their hand a little bit in that one preseason game.",
            "um when they got they got the ball in Kosen Levenson's hand on a quick easy pass right away and then another one you know a few plays later right down the seam and you know how do you make things easy on your quarterback is is give him predetermined quick easy reads that he can you know hit that back foot and and let it rip and Caleb we talked about it Caleb Williams actually looked good doing that we weren't sure if he was able to if he was going to be able to play within the confines of like a structured offense like that and he looked good doing it.",
            "And I think the way you kind of do that is make give him short, quick, easy passes and get him in a rhythm early.",
            "And I think they're going to try to establish that kind of offense pretty much throughout the entire year.",
            "And that that kind of stuff breeds, I think, or it lends itself to getting the tight ends specifically involved quickly and early.",
            "And I think that's kind of gonna kind of snowball into Coulson Lovelin getting a lot of targets and then getting a lot of confidence.",
            "And once you have that kind of stuff established and the kind of chemistry established with the quarterback, hey, I know you're going to be here when when you're supposed to be and I can let it rip and you're going to make that catch and get me yards after the catch, which is something Coulson Lovelin is very good at.",
            "I think I think it's going to be kind of a glove inhand fit with with Coulson Lovelin, the young quarterback, and this offense.",
            "I kind of felt that way about Tyler Warren.",
            "We saw him, he's coming out of Penn State.",
            "We said when scouting him, he's probably the most pro ready tight end that we saw that probably had like I think we talked about like it wouldn't surprise us if Tyler Warren had the most productive year one, but if it wouldn't surprise us also if Coulson Leland had a better long-term career.",
            "Um coming off a year at Penn State where he had 104 catches uh for over,200 yards out there.",
            "All reports that I've seen so far coming out of Indianapolis is that this coaching staff has been working on getting Tyler Warren involved in offense early and often.",
            "So with those reports saying like we said, I like Josh DS a ton.",
            "I like uh Michael Pitman as well.",
            "This is offense.",
            "I think they're going to want to keep the ball everything short and sweet.",
            "Help Daniel Jones out on his roll out who's the athletic tight end.",
            "And I think they're going to find ways to make sure that he's either the first or second look in this offense.",
            "So, for me, I think Tyler Warren, just because of target share alone, how many catches he's going to get this year, is going to finish as a tight end one.",
            "Uh, a lot of guys you could switch him out for, but I want to sneak one.",
            "I I I felt good enough about him for how how much production he's going to see.",
            "Same.",
            "You know what I And like that's like like I felt good enough about it that I was like so I I didn't get any rookies in there, but do you want to know who I actually have projected as the highest rookie tight end?",
            "Mason Taylor.",
            "Mason Taylor.",
            "Mason Taylor.",
            "I mean, I can see that, too.",
            "Yeah, no doubt.",
            "Nobody there to catch the football outside of Garrett Wilson.",
            "Wilson and him.",
            "Baron.",
            "Yes.",
            "Yeah.",
            "A ton.",
            "And then um so it leaves us with Tucker Craft.",
            "Uh I had him an eight.",
            "Matt, you had him at nine.",
            "And Garrett, you had him at nine.",
            "So we're all pretty close.",
            "somebody who finished tight end eight last year.",
            "But when you look at something, what's really interesting here when you look at him is amongst all tight ends, he led the led all tight ends in yards after contact and broken tackles.",
            "I could see him finishing so much higher if there wasn't such a mess at the wide.",
            "Like so many wide receivers, so many people get the ball, so many people to target and they spread it around so much that it's hard for me to bump him higher than I got him.",
            "And and I go back to that we we we mentioned it when he said it, Matt Lafleur, like this is a month or so ago.",
            "He said, you know, he said, \"If there's an area we got to do better at, it's featuring the tight end.\"",
            "And we saw last year that this offense targeted the tight ends 25% of the time.",
            "Um, when you have somebody who in her first year as being the main guy there excel uh with the ball in his hands like Tucker Craft did, I see why he would say something like that with such a poperri of mystery at the receiver position.",
            "It's kind of playing out.",
            "I think in the end it could be somebody like Tucker Craft is the most valuable receiving weapon we see in that offense.",
            "So, I think we're all like pretty comfortable because he finished the tight end eight last year.",
            "No reason not to do that.",
            "Yep.",
            "But he's the kind of guy like I said, right?",
            "I ended at eight for Doug Craft for a reason because that was the last guy I saw that could propel up to like as high as five and it wouldn't shock me in the least.",
            "Yeah, he's super talented, man.",
            "And and you know, given, you know, that some of these guys, you know, George KD's a little bit older.",
            "Evan Ingram's a little bit older.",
            "Travis Kelce obviously a little bit older.",
            "He's a guy that we're going to be having to have the conversation, you know, is he this next guy that's going to be able to get a tier if if Green Bay's wide receivers kind of start to dissipate in the next couple of seasons or even just solidify who's who and well, what's what's the roles there?",
            "I I mentioned it when we were doing all the division breakdowns.",
            "They have a lot of guys that are coming up on contract years.",
            "So, they it's not going to be the same thing in two years in Green Bay than it is right now.",
            "So, I I think I think there's going to be a conversation, you know, about Tucker Craft.",
            "Is he is he talented enough to be a top four guy in a couple of seasons?",
            "So, this might be a nice opportunity while he's kind of had has a little bit of a depressed um value to kind of go out and say, \"Hey, let's let's make some moves for Tuckercraft now because in two or three years, he's going to be a guy that's kind of up in this other echelon um nipping at at heels of the top tier.\"",
            "He is a great That's a really good point from a D perspective.",
            "He's probably one of the best high upside buys at the position.",
            "Yeah, absolutely.",
            "Yeah, and I don't I don't have much to add on Tucker Craft.",
            "I echo what you guys say.",
            "I think he's a good player that's in a little bit of a messy situation, but the talent overrides that for me, and so I'm willing any guy in this range is a risk, but he's a guy that I'm willing to take the risk on.",
            "All right.",
            "So, as we get ready for next week is NFL football and we are going to do what we always do before season and bring you two episodes of our bold predictions for the 2025 season.",
            "We like to get We like to really just put ourselves out there, right?",
            "Like just, you know, do we think these are 100% be true?",
            "I like to sit back.",
            "I like to sit back and listen to Rich put himself out there.",
            "That's what I My goal My goal this year is to find one bold prediction for every single team.",
            "Oh my gosh.",
            "Is one of 32 bold predictions.",
            "So I mean usually the show we don't even have to talk then I will just sit there.",
            "No no because at the shows then I usually just like I'll ram through like real quick.",
            "I don't give an analyst why because like a lot of times just like analyst I was going to let that slide.",
            "It's an analyst.",
            "I'm an analyst.",
            "I was I was going to let you wipe that dirt.",
            "That sounds like a like a Saturday Night Live sketch like and he's the analyst.",
            "I like the way you said that.",
            "I got tingles.",
            "That was like a Jeopardy thing.",
            "He reads it wrong to Sean.",
            "Sean Connor analyst.",
            "Can I have the butt experts, please?",
            "Uh, that's analyst Sean.",
            "Ah, shut up, Tbec.",
            "So, we're back next week with those.",
            "If you enjoyed um our summer talk, uh, please leave a rain review wherever you find us.",
            "Uh, we appreciate it.",
            "Helps the show.",
            "So, if you take the time, uh, leave us a ring review on the show, subscribe on YouTube, follow us everywhere else.",
            "you get your social media.",
            "Uh, and we'll see you next week for kickoff of the NFL season.",
            "And the points start to count.",
            "Points per reception, yards, touchdowns, all of that as we brace ourselves for all the injuries as well.",
            "The real fun.",
            "The real fun.",
            "All the work is leading up to this.",
            "We'll be back next week with more Dynasty Fantasy football.",
            "Adios."
        ]

        console.log("got params")

        console.log("starting analysis")
        const analysis_result = await analyzeSentiment(final_player_object, stripped_sentences)
        console.dir(analysis_result)
    }

    return (
        <>
            <div className="flex flex-col items-center min-w-screen">
                {/* {submittedText} */}
                {
                    loading ?
                        <Button disabled><Spinner /> Loading...</Button>
                        : <Button onClick={mockCallAPI}>Click me</Button>
                }
                {
                    analysisResult && sortedPlayers.length > 0 &&
                    <>
                        <h2>Analysis Result</h2>
                        {
                            sortedPlayers.map((player, index) => (
                                <div key={index}>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{player}</CardTitle>
                                            <CardDescription>{analysisResult[player].player_id}</CardDescription>
                                            {/* <CardAction>Card Action</CardAction> */}
                                        </CardHeader>
                                        <CardContent>
                                            {
                                                <img src={`https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${analysisResult[player].player_id}.png`}></img>
                                            }
                                        </CardContent>
                                        <CardFooter>
                                            <p>Card Footer</p>
                                        </CardFooter>
                                    </Card>
                                    <h2>{player}</h2>
                                    <h2>Id: {analysisResult[player].player_id}</h2>
                                    <h3>Average Label: {analysisResult[player].average_label}</h3>
                                    <h3>Mode Label: {analysisResult[player].most_frequent_label}</h3>
                                    <img src={`https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${analysisResult[player].player_id}.png`}></img>
                                </div>
                            ))
                        }
                    </>
                }
            </div>
        </>
    )
}